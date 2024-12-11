// 添加日期相关变量
let currentDate = new Date();
let currentDateKey = formatDateKey(currentDate);

// 修改数据结构
let dailyData = JSON.parse(localStorage.getItem('dailyData')) || {};
if (!dailyData[currentDateKey]) {
    dailyData[currentDateKey] = {
        timelineData: {},
        freeNotes: [],
        frogTasks: ['', '', '']
    };
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    initializeDate();
    initializeTimeline();
    initializeFrogTasks();
    initializeFreeArea();
    loadDailyData();
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
        if (dailyData[currentDateKey].timelineData[hour]) {
            timeContent.textContent = dailyData[currentDateKey].timelineData[hour];
        }
        
        // 保存输入的内容
        timeContent.addEventListener('blur', (e) => {
            const hour = e.target.dataset.hour;
            dailyData[currentDateKey].timelineData[hour] = e.target.textContent;
            saveToLocalStorage();
        });
        
        // 添加拖拽功能
        timeContent.draggable = true;
        timeContent.addEventListener('dragstart', handleDragStart);
        timeContent.addEventListener('dragover', handleDragOver);
        timeContent.addEventListener('drop', handleDrop);
        timeContent.addEventListener('dragend', handleDragEnd);
        
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
function createNote(x, y, content = '') {
    const note = document.createElement('div');
    note.className = 'note';
    
    const header = document.createElement('div');
    header.className = 'note-header';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-note';
    deleteBtn.innerHTML = '✕';
    deleteBtn.addEventListener('click', () => {
        note.remove();
        const noteIndex = dailyData[currentDateKey].freeNotes.findIndex(n => n.id === note.dataset.id);
        if (noteIndex > -1) {
            dailyData[currentDateKey].freeNotes.splice(noteIndex, 1);
            saveToLocalStorage();
        }
    });
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'note-content';
    contentDiv.contentEditable = true;
    contentDiv.textContent = content;
    
    // 保存便签内容
    contentDiv.addEventListener('blur', () => {
        const noteData = {
            id: note.dataset.id,
            content: contentDiv.textContent,
            position: {
                x: note.offsetLeft,
                y: note.offsetTop
            }
        };
        
        // 更新或添加便签数据
        const existingNoteIndex = dailyData[currentDateKey].freeNotes.findIndex(n => n.id === note.dataset.id);
        if (existingNoteIndex > -1) {
            dailyData[currentDateKey].freeNotes[existingNoteIndex] = noteData;
        } else {
            dailyData[currentDateKey].freeNotes.push(noteData);
        }
        saveToLocalStorage();
    });
    
    header.appendChild(deleteBtn);
    note.appendChild(header);
    note.appendChild(contentDiv);
    
    note.style.left = `${x}px`;
    note.style.top = `${y}px`;
    note.dataset.id = Date.now().toString();
    
    document.getElementById('free-area').appendChild(note);
    makeDraggable(note);
    makeNoteDraggableToFrogs(note);
    
    contentDiv.focus();
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

// 初始化三只青蛙任务
function initializeFrogTasks() {
    const frogTasks = document.querySelectorAll('.frog-task');
    
    frogTasks.forEach(task => {
        task.addEventListener('dragover', (e) => {
            e.preventDefault();
            task.classList.add('drag-over');
        });
        
        task.addEventListener('dragleave', () => {
            task.classList.remove('drag-over');
        });
        
        task.addEventListener('drop', (e) => {
            e.preventDefault();
            task.classList.remove('drag-over');
            const content = e.dataTransfer.getData('text/plain');
            const index = parseInt(task.dataset.index);
            dailyData[currentDateKey].frogTasks[index] = content;
            task.querySelector('.task-content').textContent = content;
            saveToLocalStorage();
        });
    });
}

// 格式化日期
function formatDate(date) {
    const options = { month: 'long', day: 'numeric', weekday: 'long' };
    return date.toLocaleDateString('zh-CN', options);
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
    dailyData[currentDateKey].frogTasks.forEach((content, index) => {
        if (content) {
            taskContents[index].textContent = content;
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
    dateElement.textContent = formatDate(currentDate);
    dateElement.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'date';
        input.style.display = 'none';
        document.body.appendChild(input);
        
        input.addEventListener('change', (e) => {
            currentDate = new Date(e.target.value);
            currentDateKey = formatDateKey(currentDate);
            if (!dailyData[currentDateKey]) {
                dailyData[currentDateKey] = {
                    timelineData: {},
                    freeNotes: [],
                    frogTasks: ['', '', '']
                };
            }
            loadDailyData();
            dateElement.textContent = formatDate(currentDate);
        });
        
        input.click();
        input.remove();
    });
}

// 使便签可拖拽到青蛙区域
function makeNoteDraggableToFrogs(note) {
    note.setAttribute('draggable', true);
    note.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', note.querySelector('.note-content').textContent);
        note.classList.add('dragging');
    });
    
    note.addEventListener('dragend', () => {
        note.classList.remove('dragging');
    });
} 