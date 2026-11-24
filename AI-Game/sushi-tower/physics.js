(function () {
  const { Bodies, Body, Composite, Events } = Matter;
  const C = window.SushiConfig;
  const Audio = window.SushiAudio;

  function createPhysics(engine) {
    const world = engine.world;
    let platform = null;
    let bodies = [];

    function makePlatform(platW) {
      if (platform) {
        Composite.remove(world, platform);
      }
      platform = Bodies.rectangle(
        C.W / 2,
        C.PLAT_Y,
        platW,
        C.PLAT_H,
        {
          isStatic: true,
          friction: 0.9,
          frictionStatic: 1.1,
          restitution: 0.02
        }
      );
      Composite.add(world, platform);
    }

    function makeBody(spec, x, y) {
      const radius = spec.kind === 'maki' ? 22 : Math.min(8, spec.h * .2);
      const body = Bodies.rectangle(
        x,
        y,
        spec.w,
        spec.h,
        {
          chamfer: { radius: radius },
          friction: 0.85,
          frictionStatic: 1.0,
          frictionAir: 0.008,
          restitution: 0.04,
          density: spec.kind === 'maki' ? 0.0022 : 0.0026,
          slop: 0.02,
          sleepThreshold: 28
        }
      );
      Body.setInertia(body, body.inertia * 1.15);
      body.spec = spec;
      return body;
    }

    Events.on(engine, 'collisionStart', event => {
      const now = performance.now();
      for (const pair of event.pairs) {
        for (const body of [pair.bodyA, pair.bodyB]) {
          if (!body.spec || body.landedAt) continue;
          body.landedAt = now;
          if (body.speed > 1.5) {
            Audio.land(body.speed);
          }
        }
      }
    });

    Events.on(engine, 'beforeUpdate', () => {
      const now = performance.now();
      for (const body of bodies) {
        if (!body.landedAt || body.isSleeping) continue;
        const age = now - body.landedAt;
        if (age > C.SETTLE_MS) continue;

        const k = 1 - age / C.SETTLE_MS;
        const damp = 0.18 * k;

        let angular = body.angularVelocity * (1 - damp);
        if (Math.abs(body.angle) < 0.35) {
          angular -= body.angle * 0.005 * k;
        }

        Body.setAngularVelocity(body, angular);
        Body.setVelocity(body, {
          x: body.velocity.x * (1 - damp * 0.6),
          y: body.velocity.y
        });
      }
    });

    return {
      makePlatform: makePlatform,
      makeBody: makeBody,
      getBodies: function () { return bodies; },
      setBodies: function (b) { bodies = b; },
      clearWorld: function () {
        Composite.clear(world, false);
        bodies = [];
      }
    };
  }

  window.SushiPhysics = {
    create: createPhysics
  };
})();