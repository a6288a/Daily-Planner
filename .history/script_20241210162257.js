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
    container.innerHTML = ''; // 清空现有内容
    
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
    header.style.cursor = 'grab'; // 添加抓取光标
    
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
    
    // 阻止内容区域的拖拽
    contentDiv.addEventListener('mousedown', (e) => {
        e.stopPropagation();
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
    const header = element.querySelector('.note-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        if (e.target.classList.contains('delete-note')) return;
        
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === header) {
            isDragging = true;
            element.style.cursor = 'grabbing';
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, element);
        }
    }

    function dragEnd(e) {
        if (!isDragging) return;
        
        isDragging = false;
        element.style.cursor = 'grab';
        
        // 更新便签位置
        const rect = document.getElementById('free-area').getBoundingClientRect();
        const noteData = {
            id: element.dataset.id,
            content: element.querySelector('.note-content').textContent,
            position: {
                x: e.clientX - rect.left - initialX + xOffset,
                y: e.clientY - rect.top - initialY + yOffset
            }
        };
        
        // 更新存储的位置
        const existingNoteIndex = dailyData[currentDateKey].freeNotes.findIndex(n => n.id === element.dataset.id);
        if (existingNoteIndex > -1) {
            dailyData[currentDateKey].freeNotes[existingNoteIndex] = noteData;
            saveToLocalStorage();
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
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
                    timelineData: {},
                    freeNotes: [],
                    frogTasks: ['', '', '']
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

// 使便签可拖拽到青蛙区域
function makeNoteDraggableToFrogs(note) {
    const header = note.querySelector('.note-header');
    let dragTimer;

    header.addEventListener('mousedown', () => {
        dragTimer = setTimeout(() => {
            note.setAttribute('draggable', true);
            note.addEventListener('dragstart', handleNoteDragStart);
            note.addEventListener('dragend', handleNoteDragEnd);
        }, 200);
    });

    header.addEventListener('mouseup', () => {
        clearTimeout(dragTimer);
    });

    function handleNoteDragStart(e) {
        e.dataTransfer.setData('text/plain', note.querySelector('.note-content').textContent);
        note.classList.add('dragging');
    }

    function handleNoteDragEnd(e) {
        note.classList.remove('dragging');
        note.removeAttribute('draggable');
        note.removeEventListener('dragstart', handleNoteDragStart);
        note.removeEventListener('dragend', handleNoteDragEnd);
    }
}

// 添加 handleDragEnd 函数
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
} 