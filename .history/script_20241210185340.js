// 添加日期相关变量
let currentDate = new Date();
let currentDateKey = formatDateKey(currentDate);

// 修改数据结构
let dailyData = JSON.parse(localStorage.getItem('dailyData')) || {};
if (!dailyData[currentDateKey]) {
    dailyData[currentDateKey] = {
        timelineData: {}, // { hour: { content: string, startTime: string, endTime: string, height: number } }
        freeNotes: [],
        frogTasks: [null, null, null]
    };
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    initializeDate();
    initializeTimeline();
    initializeFrogTasks();
    initializeFreeArea();
    loadDailyData();
    initializeHeaderMenu();
    
    // 添加清除数据功能
    document.getElementById('clearAllData').addEventListener('click', clearAllData);
});

// 初始化时间轴
function initializeTimeline() {
    const container = document.getElementById('timeline-container');
    container.innerHTML = ''; // 清空现有内容
    
    // 生成6:00-24:00的时间槽
    for (let hour = 6; hour <= 24; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.textContent = `${hour}:00`;
        
        const timeContent = createTimeContent(hour);
        
        // 加载保存的数据
        if (dailyData[currentDateKey].timelineData[hour]) {
            timeContent.textContent = dailyData[currentDateKey].timelineData[hour];
        }
        
        // 保存输入的内容
        timeContent.addEventListener('blur', (e) => {
            const hour = e.target.dataset.hour;
            const oldContent = dailyData[currentDateKey].timelineData[hour];
            const newContent = e.target.textContent;
            
            // 更新时间轴数据
            dailyData[currentDateKey].timelineData[hour] = newContent;
            
            // 更新对应的青蛙任务
            if (oldContent) {
                dailyData[currentDateKey].frogTasks = dailyData[currentDateKey].frogTasks.map(task => 
                    task === oldContent ? newContent : task
                );
                updateFrogTasks();
            }
            
            saveToLocalStorage();
        });
        
        // 添加拖拽功能
        timeContent.draggable = true;
        timeContent.addEventListener('dragstart', handleDragStart);
        timeContent.addEventListener('dragover', handleDragOver);
        timeContent.addEventListener('drop', handleDrop);
        timeContent.addEventListener('dragend', handleDragEnd);
        
        // 防止冒泡
        timeContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        timeSlot.appendChild(timeLabel);
        timeSlot.appendChild(timeContent);
        container.appendChild(timeSlot);
    }
}

// 初始化自由区域
function initializeFreeArea() {
    const freeArea = document.getElementById('free-area');
    
    // 点击空白处添加新便签
    freeArea.addEventListener('click', (e) => {
        if (e.target === freeArea) {
            const rect = freeArea.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            createNote(x, y);
        }
    });
}

// 创建新便签
function createNote(x, y, content = '') {
    const note = document.createElement('div');
    note.className = 'note';
    
    const header = document.createElement('div');
    header.className = 'note-header';
    header.style.cursor = 'grab';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-note';
    deleteBtn.innerHTML = '✕';
    deleteBtn.addEventListener('click', () => {
        const noteId = note.dataset.id;
        
        // 清除对应的青蛙任务
        dailyData[currentDateKey].frogTasks = dailyData[currentDateKey].frogTasks.map(task => 
            task && task.noteId === noteId ? null : task
        );
        updateFrogTasks();
        
        // 删除便签
        note.remove();
        const noteIndex = dailyData[currentDateKey].freeNotes.findIndex(n => n.id === noteId);
        if (noteIndex > -1) {
            dailyData[currentDateKey].freeNotes.splice(noteIndex, 1);
            saveToLocalStorage();
        }
    });
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'note-content';
    contentDiv.contentEditable = true;
    contentDiv.textContent = content;
    
    // 保存内容
    contentDiv.addEventListener('blur', () => {
        const noteData = {
            id: note.dataset.id,
            content: contentDiv.textContent,
            position: {
                x: parseFloat(note.style.left),
                y: parseFloat(note.style.top)
            }
        };
        
        // 更新便签数据
        const existingNoteIndex = dailyData[currentDateKey].freeNotes.findIndex(n => n.id === note.dataset.id);
        if (existingNoteIndex > -1) {
            dailyData[currentDateKey].freeNotes[existingNoteIndex] = noteData;
        } else {
            dailyData[currentDateKey].freeNotes.push(noteData);
        }
        
        // 更新对应的青蛙任务内容
        dailyData[currentDateKey].frogTasks = dailyData[currentDateKey].frogTasks.map(task => {
            if (task && task.noteId === note.dataset.id) {
                return { ...task, content: contentDiv.textContent };
            }
            return task;
        });
        
        updateFrogTasks();
        saveToLocalStorage();
    });
    
    header.appendChild(deleteBtn);
    note.appendChild(header);
    note.appendChild(contentDiv);
    
    // 确保初始位置在边界内
    const freeArea = document.getElementById('free-area');
    const maxX = freeArea.clientWidth - 200; // 200px 是便签的最小宽度
    const maxY = freeArea.clientHeight - 120; // 120px 是便签的最小高度
    
    const boundedX = Math.max(0, Math.min(x, maxX));
    const boundedY = Math.max(0, Math.min(y, maxY));
    
    note.style.left = `${boundedX}px`;
    note.style.top = `${boundedY}px`;
    note.dataset.id = Date.now().toString();
    
    document.getElementById('free-area').appendChild(note);
    makeDraggable(note);
    makeNoteDraggableToFrogs(note);
    
    return note;
}

// 修改便签拖拽逻辑
function makeDraggable(element) {
    const header = element.querySelector('.note-header');
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('delete-note')) return;
        
        e.preventDefault();
        isDragging = true;
        header.style.cursor = 'grabbing';
        
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = element.offsetLeft;
        initialTop = element.offsetTop;

        function onMouseMove(e) {
            if (!isDragging) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newX = initialLeft + deltaX;
            let newY = initialTop + deltaY;
            
            // 添加边界限制
            const freeArea = document.getElementById('free-area');
            const rect = freeArea.getBoundingClientRect();
            const maxX = rect.width - element.offsetWidth;
            const maxY = rect.height - element.offsetHeight;
            
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
        }

        function onMouseUp() {
            if (!isDragging) return;
            
            isDragging = false;
            header.style.cursor = 'grab';
            
            saveNotePosition(element);
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    // 防止默认的拖拽行为
    header.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });

    // 防止文本选中
    header.addEventListener('selectstart', (e) => {
        e.preventDefault();
    });
}

// 处理时间轴拖拽
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.textContent);
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const sourceHour = e.dataTransfer.getData('text/plain');
    const targetHour = e.target.dataset.hour;
    
    // 交换内容
    const temp = dailyData[currentDateKey].timelineData[sourceHour];
    dailyData[currentDateKey].timelineData[sourceHour] = dailyData[currentDateKey].timelineData[targetHour];
    dailyData[currentDateKey].timelineData[targetHour] = temp;
    
    // 更新显示
    loadDailyData();
}

// 修改青蛙区域的拖放处理
function initializeFrogTasks() {
    const frogTasks = document.querySelectorAll('.frog-task');
    
    frogTasks.forEach((task, index) => {
        const content = task.querySelector('.task-content');
        const clearBtn = task.querySelector('.task-clear');
        
        // 点击任务区域时显示选择菜单
        task.addEventListener('click', (e) => {
            if (e.target === clearBtn) return;
            
            // 显示选择菜单
            showTaskMenu(task, index);
        });
        
        // 除按钮点击事件
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            clearTask(index);
        });
    });
}

function showTaskMenu(task, taskIndex) {
    // 创建选择菜单
    const menu = document.createElement('div');
    menu.className = 'task-menu';
    
    // 获取所有便签和时间轴内容
    const notes = dailyData[currentDateKey].freeNotes;
    const timelineItems = dailyData[currentDateKey].timelineData;
    
    // 创建菜单内容
    let menuHtml = '<div class="menu-section"><h3>便签内容</h3>';
    notes.forEach(note => {
        menuHtml += `<div class="menu-item" data-id="${note.id}">${note.content}</div>`;
    });
    
    menuHtml += '</div><div class="menu-section"><h3>时间轴内容</h3>';
    Object.entries(timelineItems).forEach(([hour, content]) => {
        if (content) {
            menuHtml += `<div class="menu-item" data-hour="${hour}">${content}</div>`;
        }
    });
    menuHtml += '</div>';
    
    menu.innerHTML = menuHtml;
    
    // 定位菜单
    const rect = task.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left}px`;
    
    // 添加菜单项点击事件
    menu.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.menu-item');
        if (!menuItem) return;
        
        const content = menuItem.textContent;
        setTask(taskIndex, content);
        document.body.removeChild(menu);
    });
    
    // 点击外部关闭菜单
    function closeMenu(e) {
        if (!menu.contains(e.target)) {
            document.body.removeChild(menu);
            document.removeEventListener('click', closeMenu);
        }
    }
    
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

function setTask(index, content) {
    // 保存任务内容和来源信息
    dailyData[currentDateKey].frogTasks[index] = {
        content: content,
        timestamp: Date.now()
    };
    updateFrogTasks();
    saveToLocalStorage();
}

function clearTask(index) {
    dailyData[currentDateKey].frogTasks[index] = null;
    updateFrogTasks();
    saveToLocalStorage();
}

function updateFrogTasks() {
    const taskContents = document.querySelectorAll('.task-content');
    dailyData[currentDateKey].frogTasks.forEach((task, index) => {
        const taskContent = taskContents[index];
        if (task && task.content) {
            taskContent.textContent = task.content;
            taskContent.classList.add('has-content');
        } else {
            taskContent.textContent = '点击设置重要事项';
            taskContent.classList.remove('has-content');
        }
    });
    saveToLocalStorage();
}

// 格式化日期
function formatDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = '日一二三四五六'.charAt(date.getDay());
    return `${month}月${day}日 周${weekday}`;
}

function formatDateKey(date) {
    return date.toISOString().split('T')[0];
}

// 加载当日数据
function loadDailyData() {
    // 清空现有内容
    document.getElementById('timeline-container').innerHTML = '';
    document.getElementById('free-area').innerHTML = '';
    
    // 加载时间轴数据
    initializeTimeline();
    
    // 加载便签
    dailyData[currentDateKey].freeNotes.forEach(note => {
        createNote(note.position.x, note.position.y, note.content);
    });
    
    // 加载青蛙任务
    const taskContents = document.querySelectorAll('.task-content');
    dailyData[currentDateKey].frogTasks.forEach((task, index) => {
        const taskContent = taskContents[index];
        if (task && task.content) {
            taskContent.textContent = task.content;
            taskContent.classList.add('has-content');
        } else {
            taskContent.textContent = '点击设置重要事项';
            taskContent.classList.remove('has-content');
        }
    });
}

// 修改保存函数
function saveToLocalStorage() {
    localStorage.setItem('dailyData', JSON.stringify(dailyData));
}

// 初始化日期显示
function initializeDate() {
    const dateElement = document.getElementById('current-date');
    updateDateDisplay();
    
    dateElement.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'date';
        input.value = formatDateKey(currentDate); // 设置当前日期为默认值
        input.style.position = 'absolute';
        input.style.opacity = '0';
        input.style.pointerEvents = 'none';
        document.body.appendChild(input);
        
        input.showPicker();
        
        input.addEventListener('change', (e) => {
            currentDate = new Date(e.target.value);
            currentDateKey = formatDateKey(currentDate);
            if (!dailyData[currentDateKey]) {
                dailyData[currentDateKey] = {
                    timelineData: {}, // { hour: { content: string, startTime: string, endTime: string, height: number } }
                    freeNotes: [],
                    frogTasks: [null, null, null]
                };
            }
            updateDateDisplay();
            loadDailyData();
            input.remove();
        });
    });
}

// 添加更新日期显示的辅助函数
function updateDateDisplay() {
    const dateElement = document.getElementById('current-date');
    const formattedDate = formatDate(currentDate);
    dateElement.textContent = formattedDate;
}

// 修改便签与青蛙区域交互
function makeNoteDraggableToFrogs(note) {
    const header = note.querySelector('.note-header');
    let longPressTimer = null;
    let isDraggingToFrog = false;

    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('delete-note')) return;
        
        longPressTimer = setTimeout(() => {
            isDraggingToFrog = true;
            note.setAttribute('draggable', true);
            header.style.cursor = 'move';
            
            // 添加拖拽时的视觉反馈
            note.classList.add('dragging-to-frog');
        }, 200);
    });

    header.addEventListener('mouseup', () => {
        clearTimeout(longPressTimer);
        if (isDraggingToFrog) {
            note.removeAttribute('draggable');
            header.style.cursor = 'grab';
            note.classList.remove('dragging-to-frog');
            isDraggingToFrog = false;
        }
    });

    note.addEventListener('dragstart', (e) => {
        if (!isDraggingToFrog) return;
        e.dataTransfer.setData('text/plain', note.querySelector('.note-content').textContent);
        e.dataTransfer.setData('note-id', note.dataset.id);
        note.classList.add('dragging');
    });

    note.addEventListener('dragend', () => {
        note.classList.remove('dragging');
        note.classList.remove('dragging-to-frog');
        note.removeAttribute('draggable');
        header.style.cursor = 'grab';
        isDraggingToFrog = false;
    });
}

// 添加 handleDragEnd 函数
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

// 修改便签的删除处理
function deleteNote(note) {
    const noteId = note.dataset.id;
    
    // 清除对应的青蛙任务
    dailyData[currentDateKey].frogTasks = dailyData[currentDateKey].frogTasks.map(task => 
        task && task.noteId === noteId ? null : task
    );
    updateFrogTasks();
    
    // 删除便签
    note.remove();
    const noteIndex = dailyData[currentDateKey].freeNotes.findIndex(n => n.id === noteId);
    if (noteIndex > -1) {
        dailyData[currentDateKey].freeNotes.splice(noteIndex, 1);
        saveToLocalStorage();
    }
}

// 保存便签位置的辅助函数
function saveNotePosition(element) {
    const noteData = {
        id: element.dataset.id,
        content: element.querySelector('.note-content').textContent,
        position: {
            x: parseFloat(element.style.left),
            y: parseFloat(element.style.top)
        }
    };
    
    const existingNoteIndex = dailyData[currentDateKey].freeNotes.findIndex(n => n.id === element.dataset.id);
    if (existingNoteIndex > -1) {
        dailyData[currentDateKey].freeNotes[existingNoteIndex] = noteData;
        saveToLocalStorage();
    }
}

// 添加清除数据的函数
function clearAllData() {
    // 显示确认对话框
    if (confirm('确定要清除所有数据吗？此操作不可恢复。')) {
        // 清除本地存储
        localStorage.removeItem('dailyData');
        
        // 重置数据
        dailyData = {};
        currentDate = new Date();
        currentDateKey = formatDateKey(currentDate);
        dailyData[currentDateKey] = {
            timelineData: {}, // { hour: { content: string, startTime: string, endTime: string, height: number } }
            freeNotes: [],
            frogTasks: [null, null, null]
        };
        
        // 重新加载页面
        loadDailyData();
        
        // 显示提示
        alert('所有数据已清除');
    }
}

// 添加菜单初始化函数
function initializeHeaderMenu() {
    const menuTrigger = document.getElementById('menuTrigger');
    const headerMenu = document.getElementById('headerMenu');
    const clearAllData = document.getElementById('clearAllData');

    // 点击菜单按钮显示/隐藏菜单
    menuTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        headerMenu.classList.toggle('show');
    });

    // 点击菜单项
    clearAllData.addEventListener('click', () => {
        headerMenu.classList.remove('show');
        clearAllData();
    });

    // 点击其他地方关闭菜单
    document.addEventListener('click', (e) => {
        if (!headerMenu.contains(e.target) && !menuTrigger.contains(e.target)) {
            headerMenu.classList.remove('show');
        }
    });
}

// 修改 createTimeContent 函数
function createTimeContent(hour) {
    const timeContent = document.createElement('div');
    timeContent.className = 'time-content';
    timeContent.dataset.hour = hour;
    
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'time-content-wrapper';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'time-content-text';
    contentDiv.contentEditable = true;
    
    const dragHandle = document.createElement('span');
    dragHandle.className = 'time-drag-handle';
    dragHandle.innerHTML = '⋮⋮';
    dragHandle.title = '拖动';
    
    const timeRange = document.createElement('span');
    timeRange.className = 'time-range';
    
    // 添加调整大小的手柄
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'time-resize-handle';
    resizeHandle.title = '调整时间范围';
    
    contentWrapper.appendChild(dragHandle);
    contentWrapper.appendChild(timeRange);
    contentWrapper.appendChild(contentDiv);
    timeContent.appendChild(contentWrapper);
    timeContent.appendChild(resizeHandle);
    
    // 加载保存的数据
    if (dailyData[currentDateKey].timelineData[hour]) {
        const data = dailyData[currentDateKey].timelineData[hour];
        contentDiv.textContent = data.content || '';
        if (data.startTime && data.endTime) {
            timeRange.textContent = `${data.startTime}-${data.endTime}`;
            timeContent.style.height = `${data.height || 30}px`;
        }
    }
    
    // 添加调整大小的功能
    let isResizing = false;
    let startY;
    let startHeight;
    
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startY = e.clientY;
        startHeight = timeContent.offsetHeight;
        document.body.style.cursor = 'row-resize';
        
        function onMouseMove(e) {
            if (!isResizing) return;
            
            const deltaY = e.clientY - startY;
            const newHeight = Math.max(30, startHeight + deltaY);
            timeContent.style.height = `${newHeight}px`;
            
            // 更新时间范围
            const slots = Math.round((newHeight - 30) / 30);
            const endHour = parseInt(hour) + slots;
            const endTime = `${endHour}:00`;
            updateTimeRange(timeContent, `${hour}:00`, endTime);
        }
        
        function onMouseUp() {
            if (!isResizing) return;
            
            isResizing = false;
            document.body.style.cursor = '';
            
            // 保存高度
            const data = dailyData[currentDateKey].timelineData[hour] || {};
            data.height = timeContent.offsetHeight;
            dailyData[currentDateKey].timelineData[hour] = data;
            saveToLocalStorage();
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
    
    return timeContent;
}

// 修改时间范围选择器的位置计算
function showTimeRangePicker(timeContent, baseHour) {
    const picker = document.createElement('div');
    picker.className = 'time-range-picker';
    
    const startSelect = createTimeSelect(baseHour);
    const endSelect = createTimeSelect(baseHour + 1);
    
    picker.innerHTML = `
        <div class="picker-header">设置时间范围</div>
        <div class="picker-content">
            <div class="time-select">
                <label>开始时间</label>
                ${startSelect.outerHTML}
            </div>
            <div class="time-select">
                <label>结束时间</label>
                ${endSelect.outerHTML}
            </div>
        </div>
        <div class="picker-actions">
            <button class="picker-cancel">取消</button>
            <button class="picker-confirm">确定</button>
        </div>
    `;
    
    document.body.appendChild(picker);
    
    // 修改定位逻辑
    const rect = timeContent.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    picker.style.position = 'fixed';
    // 如果下方空间不足，则显示在上方
    if (rect.bottom + picker.offsetHeight > viewportHeight) {
        picker.style.bottom = `${viewportHeight - rect.top + 5}px`;
    } else {
        picker.style.top = `${rect.bottom + 5}px`;
    }
    picker.style.left = `${rect.left}px`;
    
    // 添加事件处理
    const confirmBtn = picker.querySelector('.picker-confirm');
    const cancelBtn = picker.querySelector('.picker-cancel');
    
    confirmBtn.addEventListener('click', () => {
        const startTime = picker.querySelector('.start-time').value;
        const endTime = picker.querySelector('.end-time').value;
        updateTimeRange(timeContent, startTime, endTime);
        document.body.removeChild(picker);
    });
    
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(picker);
    });
}

// 创建时间选择器
function createTimeSelect(defaultHour) {
    const select = document.createElement('select');
    select.className = defaultHour === 6 ? 'start-time' : 'end-time';
    
    // 生成时间选项（6:00-24:00，每30分钟一个选项）
    for (let hour = 6; hour <= 24; hour++) {
        ['00', '30'].forEach(minute => {
            const option = document.createElement('option');
            option.value = `${hour}:${minute}`;
            option.textContent = `${hour}:${minute}`;
            if (hour === defaultHour && minute === '00') {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }
    
    return select;
}

// 更新时间范围显示
function updateTimeRange(timeContent, startTime, endTime) {
    const timeRange = timeContent.querySelector('.time-range');
    const contentDiv = timeContent.querySelector('.time-content-text');
    
    if (startTime && endTime) {
        timeRange.textContent = `${startTime}-${endTime}`;
        timeRange.style.display = 'inline';
        
        // 保存时间范围到数据中
        const hour = timeContent.dataset.hour;
        if (!dailyData[currentDateKey].timelineData[hour]) {
            dailyData[currentDateKey].timelineData[hour] = {
                content: contentDiv.textContent || '',
                startTime: startTime,
                endTime: endTime
            };
        } else {
            dailyData[currentDateKey].timelineData[hour].startTime = startTime;
            dailyData[currentDateKey].timelineData[hour].endTime = endTime;
        }
        
        saveToLocalStorage();
    }
}

// 修改拖拽处理函数
function handleTimeContentDrag(timeContent) {
    const dragHandle = timeContent.querySelector('.time-drag-handle');
    let isDragging = false;
    let dragGhost = null;
    let initialMouseY;
    let initialGhostTop;

    dragHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        isDragging = true;
        const timeSlots = document.querySelectorAll('.time-slot');
        const currentSlot = timeContent.closest('.time-slot');
        const currentIndex = Array.from(timeSlots).indexOf(currentSlot);
        
        // 记录初始位置
        initialMouseY = e.clientY;
        const rect = timeContent.getBoundingClientRect();
        initialGhostTop = rect.top;
        
        // 创建拖拽时的视觉反馈元素
        dragGhost = timeContent.cloneNode(true);
        dragGhost.classList.add('time-content-ghost');
        dragGhost.style.position = 'fixed';
        dragGhost.style.width = `${timeContent.offsetWidth}px`;
        dragGhost.style.top = `${initialGhostTop}px`;
        dragGhost.style.left = `${rect.left}px`;
        dragGhost.style.pointerEvents = 'none';
        document.body.appendChild(dragGhost);
        
        // 原始元素添加拖拽状态
        timeContent.classList.add('dragging');

        function onMouseMove(e) {
            if (!isDragging) return;
            
            const deltaY = e.clientY - initialMouseY;
            const newTop = initialGhostTop + deltaY;
            dragGhost.style.top = `${newTop}px`;
            
            // 显示可放置位置
            timeSlots.forEach((slot, index) => {
                const slotRect = slot.getBoundingClientRect();
                const ghostRect = dragGhost.getBoundingClientRect();
                const ghostCenter = ghostRect.top + ghostRect.height / 2;
                
                if (ghostCenter >= slotRect.top && ghostCenter <= slotRect.bottom && index !== currentIndex) {
                    slot.classList.add('drop-target');
                } else {
                    slot.classList.remove('drop-target');
                }
            });
        }

        function onMouseUp(e) {
            if (!isDragging) return;
            
            isDragging = false;
            timeContent.classList.remove('dragging');
            
            const targetIndex = findTargetSlotIndex(timeSlots, dragGhost.getBoundingClientRect().top + dragGhost.offsetHeight / 2);
            document.body.removeChild(dragGhost);
            dragGhost = null;
            
            if (targetIndex !== -1 && targetIndex !== currentIndex) {
                const sourceHour = parseInt(timeContent.dataset.hour);
                const targetHour = parseInt(timeSlots[targetIndex].querySelector('.time-content').dataset.hour);
                
                // 交换数据
                const temp = dailyData[currentDateKey].timelineData[sourceHour];
                dailyData[currentDateKey].timelineData[sourceHour] = dailyData[currentDateKey].timelineData[targetHour];
                dailyData[currentDateKey].timelineData[targetHour] = temp;
                
                loadDailyData();
            }
            
            timeSlots.forEach(slot => slot.classList.remove('drop-target'));
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

// 修改查找目标时间槽的函数
function findTargetSlotIndex(slots, y) {
    return Array.from(slots).findIndex(slot => {
        const rect = slot.getBoundingClientRect();
        return y >= rect.top && y <= rect.bottom;
    });
} 