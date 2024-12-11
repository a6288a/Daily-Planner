// 初始化数据
let timelineData = JSON.parse(localStorage.getItem('timelineData')) || {};
let freeNotes = JSON.parse(localStorage.getItem('freeNotes')) || [];
let frogTasks = JSON.parse(localStorage.getItem('frogTasks')) || ['', '', '']; // 三只青蛙任务数据

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    initializeTimeline();
    initializeFreeArea();
    initializeFrogTasks();
    loadSavedData();
});

// 初始化时间轴
function initializeTimeline() {
    const container = document.getElementById('timeline-container');
    
    // 生成6:00-24:00的时间槽
    for (let hour = 6; hour <= 24; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.textContent = `${hour}:00`;
        
        const timeContent = document.createElement('div');
        timeContent.className = 'time-content';
        timeContent.contentEditable = true;
        timeContent.dataset.hour = hour;
        
        // 加载保存的数据
        if (timelineData[hour]) {
            timeContent.textContent = timelineData[hour];
        }
        
        // 保存输入的内容
        timeContent.addEventListener('blur', (e) => {
            const hour = e.target.dataset.hour;
            timelineData[hour] = e.target.textContent;
            saveToLocalStorage();
        });
        
        // 添加拖拽功能
        timeContent.draggable = true;
        timeContent.addEventListener('dragstart', handleDragStart);
        timeContent.addEventListener('dragover', handleDragOver);
        timeContent.addEventListener('drop', handleDrop);
        
        timeSlot.appendChild(timeLabel);
        timeSlot.appendChild(timeContent);
        container.appendChild(timeSlot);
    }
}

// 初始化自由区域
function initializeFreeArea() {
    const freeArea = document.getElementById('free-area');
    
    // 点击空白处添加新便签
    freeArea.addEventListener('dblclick', (e) => {
        if (e.target === freeArea) {
            createNote(e.clientX, e.clientY);
        }
    });
}

// 创建新便签
function createNote(x, y) {
    const note = document.createElement('div');
    note.className = 'note';
    
    const textarea = document.createElement('textarea');
    textarea.className = 'editable';
    
    note.style.left = `${x}px`;
    note.style.top = `${y}px`;
    
    note.appendChild(textarea);
    document.getElementById('free-area').appendChild(note);
    
    // 使便签可拖动
    makeDraggable(note);
    
    // 保存便签内容
    textarea.addEventListener('blur', () => {
        const noteData = {
            id: Date.now(),
            content: textarea.value,
            position: {
                x: note.offsetLeft,
                y: note.offsetTop
            }
        };
        freeNotes.push(noteData);
        saveToLocalStorage();
    });
}

// 使元素可拖动
function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    element.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }
    
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// 处理时间轴拖拽
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.hour);
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const sourceHour = e.dataTransfer.getData('text/plain');
    const targetHour = e.target.dataset.hour;
    
    // 交换内容
    const temp = timelineData[sourceHour];
    timelineData[sourceHour] = timelineData[targetHour];
    timelineData[targetHour] = temp;
    
    // 更新显示
    loadSavedData();
}

// 初始化三只青蛙任务
function initializeFrogTasks() {
    const frogTaskElements = document.querySelectorAll('.frog-task');
    
    frogTaskElements.forEach((task, index) => {
        // 加载保存的数据
        task.textContent = frogTasks[index] || '';
        
        // 保存任务内容
        task.addEventListener('blur', (e) => {
            frogTasks[index] = e.target.textContent;
            saveToLocalStorage();
        });
        
        // 添加键盘事件
        task.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                task.blur();
            }
        });
        
        // 添加动画效果
        task.addEventListener('focus', () => {
            task.style.transform = 'scale(1.02)';
        });
        
        task.addEventListener('blur', () => {
            task.style.transform = 'scale(1)';
        });
    });
}

// 加载保存的数据
function loadSavedData() {
    // 加载时间轴数据
    for (const hour in timelineData) {
        const timeContent = document.querySelector(`[data-hour="${hour}"]`);
        if (timeContent) {
            timeContent.textContent = timelineData[hour];
        }
    }
    
    // 加载自由区便签
    freeNotes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.style.left = `${note.position.x}px`;
        noteElement.style.top = `${note.position.y}px`;
        
        const textarea = document.createElement('textarea');
        textarea.className = 'editable';
        textarea.value = note.content;
        
        noteElement.appendChild(textarea);
        document.getElementById('free-area').appendChild(noteElement);
        makeDraggable(noteElement);
    });
    
    // 加载青蛙任务
    const frogTaskElements = document.querySelectorAll('.frog-task');
    frogTaskElements.forEach((task, index) => {
        task.textContent = frogTasks[index] || '';
    });
}

// 保存到本地存储
function saveToLocalStorage() {
    localStorage.setItem('timelineData', JSON.stringify(timelineData));
    localStorage.setItem('freeNotes', JSON.stringify(freeNotes));
    localStorage.setItem('frogTasks', JSON.stringify(frogTasks));
} 