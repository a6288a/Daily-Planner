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
        // 删除便签时，检查是否需要清除青蛙区域的对应内容
        const noteId = note.dataset.id;
        dailyData[currentDateKey].frogTasks = dailyData[currentDateKey].frogTasks.map(task => 
            task && task.noteId === noteId ? null : task
        );
        updateFrogTasks();
        
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
        
        const existingNoteIndex = dailyData[currentDateKey].freeNotes.findIndex(n => n.id === note.dataset.id);
        if (existingNoteIndex > -1) {
            dailyData[currentDateKey].freeNotes[existingNoteIndex] = noteData;
        } else {
            dailyData[currentDateKey].freeNotes.push(noteData);
        }
        
        // 更新青蛙区域中对应的内容
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
    
    note.style.left = `${x}px`;
    note.style.top = `${y}px`;
    note.dataset.id = Date.now().toString();
    
    document.getElementById('free-area').appendChild(note);
    makeDraggable(note);
    makeNoteDraggableToFrogs(note);
    
    return note;
}

// 使元素可拖动
function makeDraggable(element) {
    const header = element.querySelector('.note-header');
    let isDragging = false;
    let longPressTimer;
    let initialX;
    let initialY;
    let currentX = 0;
    let currentY = 0;

    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('delete-note')) return;
        
        // 设置长按计时器
        longPressTimer = setTimeout(() => {
            isDragging = true;
            header.style.cursor = 'grabbing';
            
            initialX = e.clientX - currentX;
            initialY = e.clientY - currentY;
        }, 200); // 200ms的长按判定
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        element.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    });

    document.addEventListener('mouseup', (e) => {
        clearTimeout(longPressTimer);
        
        if (!isDragging) return;
        
        isDragging = false;
        header.style.cursor = 'grab';
        
        const rect = document.getElementById('free-area').getBoundingClientRect();
        const finalX = e.clientX - rect.left - (e.clientX - initialX - currentX);
        const finalY = e.clientY - rect.top - (e.clientY - initialY - currentY);
        
        element.style.transform = 'none';
        element.style.left = `${finalX}px`;
        element.style.top = `${finalY}px`;
        
        const noteData = {
            id: element.dataset.id,
            content: element.querySelector('.note-content').textContent,
            position: { x: finalX, y: finalY }
        };
        
        const existingNoteIndex = dailyData[currentDateKey].freeNotes.findIndex(n => n.id === element.dataset.id);
        if (existingNoteIndex > -1) {
            dailyData[currentDateKey].freeNotes[existingNoteIndex] = noteData;
            saveToLocalStorage();
        }
        
        currentX = 0;
        currentY = 0;
    });
    
    // 防止鼠标移出窗口时没有触发mouseup
    document.addEventListener('mouseleave', () => {
        clearTimeout(longPressTimer);
        if (isDragging) {
            isDragging = false;
            header.style.cursor = 'grab';
            element.style.transform = 'none';
        }
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
            
            const noteId = e.dataTransfer.getData('note-id');
            const content = e.dataTransfer.getData('text/plain');
            const index = parseInt(task.dataset.index);
            
            // 更新青蛙任务数据，保存便签ID和内容
            dailyData[currentDateKey].frogTasks[index] = {
                noteId: noteId,
                content: content
            };
            
            updateFrogTasks();
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
    dailyData[currentDateKey].frogTasks.forEach((task, index) => {
        taskContents[index].textContent = task ? task.content : '';
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
    note.setAttribute('draggable', true);
    
    note.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', note.querySelector('.note-content').textContent);
        e.dataTransfer.setData('note-id', note.dataset.id);
        note.classList.add('dragging');
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

// 添加更新青蛙任务的辅助函数
function updateFrogTasks() {
    const taskContents = document.querySelectorAll('.task-content');
    dailyData[currentDateKey].frogTasks.forEach((content, index) => {
        taskContents[index].textContent = content || '';
    });
    saveToLocalStorage();
} 