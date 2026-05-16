        const state = {
            id: null, name: '', w: 1080, h: 1080, tool: 'pen',
            scale: 1, tx: 0, ty: 0, active: false, lx: 0, ly: 0,
            undo: [], redo: [], bgColor: '#ffffff'
        };
        // アート制作のインスピレーションになるような汎用的で安全な名前のリスト
        const randomNames = {
            abstract_concepts: [
                '無題の構成', 'Composition No.1', '色彩の調和', 'Harmony of Colors', '抽象の風景', 'Abstract Landscape',
                'リズムと形', 'Rhythm and Shape', '重なり合う面', 'Overlapping Planes', '内なる光', 'Inner Light',
                '時の断片', 'Fragments of Time', '静寂の余白', 'Silent Space', 'バランス', 'Balance'
            ],
            nature_landscapes: [
                '深い森', 'Deep Forest', '波のささやき', 'Whispering Waves', '山頂の雲', 'Mountain Top Clouds',
                '木漏れ日', 'Sunlight through Leaves', '瑞々しい緑', 'Lush Greenery', '夜の静寂', 'Night Silence',
                '朝霧', 'Morning Mist', '風の通り道', 'Path of the Wind', '砂丘の記憶', 'Memory of Dunes'
            ],
            botanical: [
                '青い花', 'Blue Flower', '新緑の葉', 'Fresh Leaves', '舞い落ちる花びら', 'Falling Petals',
                'サボテンの静物', 'Cactus Still Life', 'ひまわり', 'Sunflower', '銀杏並木', 'Ginkgo Avenue',
                '睡蓮の池', 'Water Lily Pond', '野草', 'Wildflowers'
            ],
            celestial_sky: [
                '満天の星', 'Starry Night', '銀河の旅', 'Galactic Journey', '月光の庭', 'Moonlight Garden',
                '青い惑星', 'Blue Planet', '流れ星の願い', 'Wish on a Star', '薄明の空', 'Twilight Sky',
                '茜色の雲', 'Madder Clouds', '無限の宙', 'Infinite Space', '暁', 'Daybreak'
            ],
            artistic_textures: [
                '水彩の響き', 'Watercolor Echo', '油彩の息遣い', 'Oil Strokes', 'パステルの夢', 'Pastel Dream',
                'キャンバスの記憶', 'Canvas Memory', 'インクの広がり', 'Ink Spread', '素描の跡', 'Sketch Marks',
                'コラージュ', 'Collage Piece', 'グラデーションの実験', 'Gradation Experiment'
            ],
            seasonal_moments: [
                '春の芽吹き', 'Spring Awakening', '夏休みの終わり', 'End of Summer', '秋の彩り', 'Autumn Colors',
                '冬のぬくもり', 'Winter Warmth', '初雪の朝', 'First Snow Morning', '陽だまりの午後', 'Sunny Afternoon'
            ],
            colors_and_gems: [
                '碧玉', 'Jasper', '群青の海', 'Ultramarine Sea', '琥珀の光', 'Amber Glow',
                '真珠の輝き', 'Pearl Luster', '深紅の色彩', 'Deep Crimson', 'エメラルドの森', 'Emerald Forest',
                '瑠璃色の夜', 'Lapis Lazuli Night', '黄金の季節', 'Golden Season', 'プリズムの反射', 'Prism Reflection'
            ],
            simple_still_life: [
                '静物：窓辺の果実', 'Still Life: Fruit', '一輪挿し', 'Single Flower Vase', '机上の鍵', 'Key on Table',
                '砂時計', 'Hourglass', '透明なグラス', 'Clear Glass', '読みかけの本', 'Open Book'
            ]
        };
        

        const layers = {
            data: [],
            activeId: null,

            add(isBase = false, savedInfo = null) {
                const id = savedInfo ? savedInfo.id : (isBase ? 'layer_0' : 'layer_' + Date.now());
                const cv = document.createElement('canvas');
                cv.width = state.w; cv.height = state.h; cv.id = id;
                const sc = document.getElementById('stage-container');
                const il = document.getElementById('interaction-layer');
                
                if (isBase) {
                    sc.insertBefore(cv, il);
                    this.data.unshift({ id, name: savedInfo ? savedInfo.name : '背景', vis: true, lock: true });
                } else {
                    sc.insertBefore(cv, il);
                    this.data.push({ id, name: savedInfo ? savedInfo.name : 'レイヤー ' + this.data.length, vis: true, lock: false });
                }
                
                if (savedInfo && savedInfo.data) {
                    const ctx = cv.getContext('2d');
                    const img = new Image();
                    img.onload = () => ctx.drawImage(img, 0, 0);
                    img.src = savedInfo.data;
                }

                this.select(id);
                this.syncZ();
                this.render();
            },

            select(id) { 
                this.activeId = id; 
                this.render(); 
            },

            updateBg(color) {
                state.bgColor = color;
                const canvas = document.getElementById('layer_0');
                if(!canvas) return;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, state.w, state.h);
                app.save();
            },

            move(id, dir, e) {
                e.stopPropagation();
                const idx = this.data.findIndex(l => l.id === id);
                if (this.data[idx].lock) return;
                const target = idx + dir;
                if (target < 1 || target >= this.data.length) return;
                [this.data[idx], this.data[target]] = [this.data[target], this.data[idx]];
                this.syncZ();
                this.render();
                app.save();
            },

            syncZ() {
                const sc = document.getElementById('stage-container');
                const il = document.getElementById('interaction-layer');
                this.data.forEach(l => {
                    const el = document.getElementById(l.id);
                    if(el) sc.insertBefore(el, il);
                });
            },

            toggle(id, e) {
                e.stopPropagation();
                const l = this.data.find(x => x.id === id);
                l.vis = !l.vis;
                document.getElementById(id).style.display = l.vis ? 'block' : 'none';
                this.render();
            },

            remove(id, e) {
                e.stopPropagation();
                const l = this.data.find(x => x.id === id);
                if (l.lock) return;
                this.data = this.data.filter(x => x.id !== id);
                const el = document.getElementById(id);
                if(el) el.remove();
                if (this.activeId === id) this.activeId = this.data[this.data.length-1].id;
                this.render();
                app.save();
            },

            render() {
                const list = document.getElementById('layer-list');
                list.innerHTML = '';
                [...this.data].reverse().forEach(l => {
                    const div = document.createElement('div');
                    div.className = `layer-item ${l.id === this.activeId ? 'active' : ''}`;
                    div.onclick = () => this.select(l.id);
                    div.innerHTML = `
                        <button class="btn layer-btn-small" onclick="layers.toggle('${l.id}', event)">
                            <span class="material-symbols-rounded layer-icon-small">${l.vis ? 'visibility' : 'visibility_off'}</span>
                        </button>
                        <input class="layer-name" value="${l.name}" ${l.lock ? 'readonly' : ''} onchange="layers.data.find(x=>x.id==='${l.id}').name=this.value" onclick="event.stopPropagation()">
                        <div class="header-actions" style="gap:2px;">
                            ${l.lock ? `
                                <div class="bg-picker-container">
                                    <span class="material-symbols-rounded bg-picker-icon">palette</span>
                                    <input type="color" value="${state.bgColor}" oninput="layers.updateBg(this.value)" class="bg-picker-input">
                                </div>
                            ` : `
                                <button class="btn layer-btn-small" onclick="layers.move('${l.id}', 1, event)"><span class="material-symbols-rounded layer-icon-small">expand_less</span></button>
                                <button class="btn layer-btn-small" onclick="layers.move('${l.id}', -1, event)"><span class="material-symbols-rounded layer-icon-small">expand_more</span></button>
                                <button class="btn layer-btn-small" style="color:var(--danger);" onclick="layers.remove('${l.id}', event)"><span class="material-symbols-rounded layer-icon-small">delete</span></button>
                            `}
                        </div>
                    `;
                    list.appendChild(div);
                });
            }
        };

        const app = {
            boot() {
                const lastId = localStorage.getItem('canvas_last_id');
                const saved = JSON.parse(localStorage.getItem('canvas_pro_data') || '[]');
                
                if (lastId && saved.find(p => p.id === lastId)) {
                    this.load(lastId);
                } else if (saved.length) {
                    this.load(saved[0].id);
                } else {
                    ui.showCreate();
                }

                this.bind();
                window.addEventListener('resize', () => this.fit());
            },

            setup(savedLayers = null) {
                const sc = document.getElementById('stage-container');
                sc.querySelectorAll('canvas').forEach(c => c.remove());
                sc.style.width = state.w + 'px'; sc.style.height = state.h + 'px';
                layers.data = [];

                if (savedLayers) {
                    savedLayers.forEach((l, idx) => layers.add(idx === 0, l));
                } else {
                    layers.add(true);
                    layers.updateBg(state.bgColor);
                }

                this.fit();
                state.undo = [];
                state.redo = [];
            },

            bind() {
                const il = document.getElementById('interaction-layer');
                const cursor = document.getElementById('brush-cursor');

                il.onpointerdown = (e) => {
                    if (state.tool === 'move') { state.active = true; state.lx = e.clientX; state.ly = e.clientY; return; }
                    this.pushUndo();
                    const p = this.getPos(e);
                    if (state.tool === 'fill') { this.floodFill(Math.floor(p.x), Math.floor(p.y)); return; }
                    state.active = true; state.lx = p.x; state.ly = p.y;
                    this.draw(p.x, p.y);
                };

                window.onpointermove = (e) => {
                    cursor.style.left = e.clientX + 'px';
                    cursor.style.top = e.clientY + 'px';
                    if (!state.active) return;
                    if (state.tool === 'move') {
                        state.tx += (e.clientX - state.lx); state.ty += (e.clientY - state.ly);
                        state.lx = e.clientX; state.ly = e.clientY; this.updateView();
                    } else if (state.tool !== 'fill') {
                        const p = this.getPos(e); 
                        this.draw(p.x, p.y);
                        state.lx = p.x; state.ly = p.y;
                    }
                };

                window.onpointerup = () => { if(state.active) { state.active = false; this.save(); } };
                il.onpointerenter = () => { if(state.tool !== 'move') cursor.style.display = 'block'; };
                il.onpointerleave = () => { cursor.style.display = 'none'; };
            },

            getPos(e) {
                const r = document.getElementById('stage-container').getBoundingClientRect();
                return { x: (e.clientX - r.left) / state.scale, y: (e.clientY - r.top) / state.scale };
            },

            draw(x, y) {
                const l = layers.data.find(x => x.id === layers.activeId);
                if (!l || !l.vis) return;
                const ctx = document.getElementById(l.id).getContext('2d');
                ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                ctx.lineWidth = document.getElementById('size-slider').value;
                ctx.strokeStyle = document.getElementById('color-pick').value;
                ctx.globalCompositeOperation = state.tool === 'eraser' ? 'destination-out' : 'source-over';
                ctx.beginPath(); ctx.moveTo(state.lx, state.ly); ctx.lineTo(x, y); ctx.stroke();
            },

            floodFill(sx, sy) {
                const l = layers.data.find(x => x.id === layers.activeId);
                if (!l || !l.vis) return;
                const ctx = document.getElementById(l.id).getContext('2d');
                const img = ctx.getImageData(0,0,state.w,state.h);
                const d = img.data;
                const i = (sy*state.w+sx)*4;
                const target = [d[i], d[i+1], d[i+2], d[i+3]];
                const color = document.getElementById('color-pick').value;
                const fill = [parseInt(color.slice(1,3),16), parseInt(color.slice(3,5),16), parseInt(color.slice(5,7),16), 255];
                if (target[0]===fill[0] && target[1]===fill[1] && target[2]===fill[2] && target[3]===fill[3]) return;
                
                const q = [[sx, sy]];
                while(q.length) {
                    const [x, y] = q.pop();
                    const cur = (y*state.w+x)*4;
                    if (d[cur]===target[0] && d[cur+1]===target[1] && d[cur+2]===target[2] && d[cur+3]===target[3]) {
                        d[cur]=fill[0]; d[cur+1]=fill[1]; d[cur+2]=fill[2]; d[cur+3]=255;
                        if(x>0) q.push([x-1, y]); if(x<state.w-1) q.push([x+1, y]);
                        if(y>0) q.push([x, y-1]); if(y<state.h-1) q.push([x, y+1]);
                    }
                }
                ctx.putImageData(img,0,0);
                this.save();
            },

            pushUndo() {
                state.undo.push(layers.data.map(l => ({ id: l.id, data: document.getElementById(l.id).toDataURL() })));
                if(state.undo.length > 20) state.undo.shift();
                state.redo = [];
            },

            undo() {
                if(!state.undo.length) return;
                state.redo.push(layers.data.map(l => ({ id: l.id, data: document.getElementById(l.id).toDataURL() })));
                this.apply(state.undo.pop());
                this.save();
            },

            redo() {
                if(!state.redo.length) return;
                state.undo.push(layers.data.map(l => ({ id: l.id, data: document.getElementById(l.id).toDataURL() })));
                this.apply(state.redo.pop());
                this.save();
            },

            apply(snap) {
                snap.forEach(s => {
                    const cv = document.getElementById(s.id);
                    if(!cv) return;
                    const ctx = cv.getContext('2d');
                    const img = new Image();
                    img.onload = () => { ctx.clearRect(0,0,state.w,state.h); ctx.drawImage(img,0,0); };
                    img.src = s.data;
                });
            },

            updateView() { document.getElementById('stage-container').style.transform = `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`; },
            
            fit() {
                const v = document.getElementById('viewport');
                state.scale = Math.min((v.clientWidth - 40) / state.w, (v.clientHeight - 100) / state.h, 1);
                state.tx = 0; state.ty = 0; 
                this.updateView();
                this.updateCursor();
            },

            setTool(t) {
                state.tool = t;
                document.querySelectorAll('#toolbar .btn').forEach(b => b.classList.remove('active'));
                const target = document.querySelector(`[data-tool="${t}"]`);
                if(target) target.classList.add('active');
            },

            updateCursor() {
                const cursor = document.getElementById('brush-cursor');
                const size = document.getElementById('size-slider').value * state.scale;
                cursor.style.width = size + 'px'; cursor.style.height = size + 'px';
                cursor.style.marginLeft = -(size/2) + 'px'; cursor.style.marginTop = -(size/2) + 'px';
            },

            createNew() {
                const p = document.getElementById('res-preset').value;
                if(p === 'custom') { state.w = +document.getElementById('in-w').value; state.h = +document.getElementById('in-h').value; }
                else { [state.w, state.h] = p.split('x').map(Number); }
                state.id = 'pj_' + Date.now();
                state.name = document.getElementById('art-name-input').value || '無題の作品';
                state.bgColor = '#ffffff';
                this.setup(); 
                this.save(); 
                ui.closeCreate(); 
                ui.closeProjects();
            },

            save() {
                if(!state.id) return;
                const list = JSON.parse(localStorage.getItem('canvas_pro_data') || '[]');
                const combined = document.createElement('canvas');
                combined.width = state.w; combined.height = state.h;
                const cctx = combined.getContext('2d');
                
                const layerStates = layers.data.map(l => ({
                    id: l.id,
                    name: l.name,
                    data: document.getElementById(l.id).toDataURL()
                }));

                layers.data.forEach(l => { if(l.vis) cctx.drawImage(document.getElementById(l.id), 0, 0); });
                const thumb = combined.toDataURL('image/jpeg', 0.1);
                
                const idx = list.findIndex(p => p.id === state.id);
                const info = { 
                    id: state.id, name: state.name, w: state.w, h: state.h, 
                    thumb, bgColor: state.bgColor, layers: layerStates 
                };

                if(idx === -1) list.unshift(info); else list[idx] = info;
                localStorage.setItem('canvas_pro_data', JSON.stringify(list));
                localStorage.setItem('canvas_last_id', state.id);
            },

            load(id) {
                const list = JSON.parse(localStorage.getItem('canvas_pro_data') || '[]');
                const p = list.find(x => x.id === id);
                if(p) { 
                    state.id = id; state.name = p.name; state.w = p.w; state.h = p.h; 
                    state.bgColor = p.bgColor || '#ffffff'; 
                    this.setup(p.layers || null); 
                }
                localStorage.setItem('canvas_last_id', id);
                ui.closeProjects();
            },

            exportImage() {
                const out = document.createElement('canvas');
                out.width = state.w; out.height = state.h;
                const octx = out.getContext('2d');
                layers.data.forEach(l => { if(l.vis) octx.drawImage(document.getElementById(l.id), 0, 0); });

                const now = new Date();
                const ts = now.toISOString().replace(/[:.]/g, '-');
                const name = state.name.replace(/\s+/g, '_');
                const a = document.createElement('a');
                a.download = `Art-${name}_${ts}.png`;
                a.href = out.toDataURL('image/png');
                a.click();
            }
        };

        const ui = {
            openProjects() { this.renderProjects(); document.getElementById('project-modal').style.display = 'flex'; },
            closeProjects() { document.getElementById('project-modal').style.display = 'none'; },
            showCreate() { 
                const cats = Object.keys(randomNames);
                const names = randomNames[cats[Math.floor(Math.random() * cats.length)]];
                document.getElementById('art-name-input').value = names[Math.floor(Math.random() * names.length)];
                document.getElementById('create-modal').style.display = 'flex'; 
            },
            closeCreate() { document.getElementById('create-modal').style.display = 'none'; },
            onPresetChange() { document.getElementById('custom-fields').style.display = document.getElementById('res-preset').value === 'custom' ? 'flex' : 'none'; },
            toggleTheme() {
                const t = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                document.body.setAttribute('data-theme', t);
                document.getElementById('mode-icon').innerText = t === 'dark' ? 'dark_mode' : 'light_mode';
            },
            deleteProject(id, e) {
                e.stopPropagation();
                if(!confirm('作品を削除しますか？')) return;
                let list = JSON.parse(localStorage.getItem('canvas_pro_data') || '[]');
                list = list.filter(p => p.id !== id);
                localStorage.setItem('canvas_pro_data', JSON.stringify(list));
                if(state.id === id) localStorage.removeItem('canvas_last_id');
                this.renderProjects();
            },
            renderProjects() {
                const list = JSON.parse(localStorage.getItem('canvas_pro_data') || '[]');
                const container = document.getElementById('project-list');
                container.innerHTML = list.map(p => `
                    <div class="project-card" onclick="app.load('${p.id}')">
                        <div class="thumb-prev"><img src="${p.thumb || ''}"></div>
                        <div style="flex:1; min-width:0;">
                            <div style="font-size:14px; font-weight:800; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.name}</div>
                            <div style="font-size:10px; color:var(--sub);">${p.w} x ${p.h}</div>
                        </div>
                        <button class="btn" style="color:var(--danger); width:32px;" onclick="ui.deleteProject('${p.id}', event)"><span class="material-symbols-rounded">delete</span></button>
                    </div>
                `).join('') || '<div style="text-align:center; padding:40px; color:var(--sub); font-size: 13px;">ギャラリーは空です</div>';
            }
        };

        window.app = app;
        window.ui = ui;
        window.layers = layers;

        document.getElementById('size-slider').oninput = (e) => { 
            document.getElementById('sz-num').innerText = e.target.value; 
            app.updateCursor();
        };

        window.onload = () => app.boot();
    
