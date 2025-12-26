// ============================================
// SCHEDULE PAGE
// ============================================

class ScheduleManager {
    constructor() {
        this.schedule = [];
        this.currentView = 'weekly';
        this.currentDate = new Date();
        this.selectedTimezone = 'auto';
        this.init();
    }

    /**
     * Initialize schedule page
     */
    async init() {
        await this.loadScheduleData();
        this.initViewToggle();
        this.initTimezoneSelector();
        this.initDateNavigation();
        this.renderSchedule();
        this.initProgramModal();
    }

    /**
     * Load schedule data from storage/cloud
     */
    async loadScheduleData() {
        try {
            // Try Cloud first
            if (window.Cloud && window.Cloud.enabled) {
                if (!window.Cloud.initialized) await window.Cloud.init();
                const cloudSchedule = await window.Cloud.get('schedule');
                if (cloudSchedule) {
                    Utils.storage.set('scheduleEvents', cloudSchedule);
                }
            }
        } catch (e) {
            console.error('Error loading from cloud:', e);
        }

        this.schedule = Utils.storage.get('scheduleEvents') || [];
    }

    /**
     * Initialize view toggle (weekly/daily)
     */
    initViewToggle() {
        const toggleButtons = document.querySelectorAll('.view-toggle__btn');
        
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                toggleButtons.forEach(b => b.classList.remove('view-toggle__btn--active'));
                btn.classList.add('view-toggle__btn--active');
                
                this.currentView = btn.dataset.view;
                this.renderSchedule();
            });
        });
    }

    /**
     * Initialize timezone selector
     */
    initTimezoneSelector() {
        const select = document.getElementById('timezoneSelect');
        if (!select) return;

        select.addEventListener('change', (e) => {
            this.selectedTimezone = e.target.value;
            this.renderSchedule();
        });

        // Set default to auto
        if (this.selectedTimezone === 'auto') {
            // Detect user timezone
            this.selectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
    }

    /**
     * Initialize date navigation
     */
    initDateNavigation() {
        const prevBtn = document.getElementById('prevWeek');
        const nextBtn = document.getElementById('nextWeek');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.navigateDate(-1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.navigateDate(1);
            });
        }
    }

    /**
     * Navigate date forward/backward
     */
    navigateDate(direction) {
        const days = this.currentView === 'weekly' ? 7 : 1;
        this.currentDate.setDate(this.currentDate.getDate() + (days * direction));
        this.updateDateDisplay();
        this.renderSchedule();
    }

    /**
     * Update date display
     */
    updateDateDisplay() {
        const dateElement = document.getElementById('currentDate');
        if (!dateElement) return;

        if (this.currentView === 'weekly') {
            const weekStart = new Date(this.currentDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            dateElement.textContent = `Week of ${Utils.formatDate(weekStart)}`;
        } else {
            dateElement.textContent = Utils.formatDate(this.currentDate);
        }
    }

    /**
     * Render schedule
     */
    renderSchedule() {
        if (this.currentView === 'weekly') {
            this.renderWeeklyView();
        } else {
            this.renderDailyView();
        }
        this.updateDateDisplay();
    }

    /**
     * Render weekly view
     */
    renderWeeklyView() {
        const scheduleBody = document.getElementById('scheduleBody');
        if (!scheduleBody) return;

        scheduleBody.innerHTML = '';

        // Get week days
        const weekDays = this.getWeekDays();

        // Render header
        this.renderWeekHeader(weekDays);

        // Group programs by time slot
        const timeSlots = this.generateTimeSlots();

        timeSlots.forEach(time => {
            const row = document.createElement('div');
            row.className = 'schedule-row';

            const timeCell = document.createElement('div');
            timeCell.className = 'schedule-time';
            timeCell.textContent = time;
            row.appendChild(timeCell);

            const daysContainer = document.createElement('div');
            daysContainer.className = 'schedule-days';

            weekDays.forEach(date => {
                const cell = this.createScheduleCell(date, time);
                daysContainer.appendChild(cell);
            });

            row.appendChild(daysContainer);
            scheduleBody.appendChild(row);
        });
    }

    /**
     * Render week header
     */
    renderWeekHeader(weekDays) {
        const headerDays = document.getElementById('scheduleHeaderDays');
        if (!headerDays) return;

        headerDays.innerHTML = '';

        weekDays.forEach(date => {
            const dayElement = document.createElement('div');
            dayElement.className = 'schedule-header__day';
            
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = date.getDate();
            
            dayElement.innerHTML = `
                <div>${dayName}</div>
                <div>${dayNum}</div>
            `;
            
            headerDays.appendChild(dayElement);
        });
    }

    /**
     * Render daily view
     */
    renderDailyView() {
        const dailySchedule = document.getElementById('dailySchedule');
        if (!dailySchedule) return;

        dailySchedule.innerHTML = '';

        const dayPrograms = this.schedule.filter(p => this.isEventOnDate(p, this.currentDate));
        
        // Sort by time
        dayPrograms.sort((a, b) => a.startTime.localeCompare(b.startTime));

        if (dayPrograms.length === 0) {
            dailySchedule.innerHTML = '<p class="text-center">No programs scheduled for this day</p>';
            return;
        }

        dayPrograms.forEach(program => {
            const endTime = this.calculateEndTime(program.startTime, program.duration);
            const displayProgram = {
                ...program,
                endTime: endTime,
                program: program.title || program.program,
                date: this.currentDate.toISOString().split('T')[0],
                type: program.type || 'recorded'
            };
            const card = this.createProgramCard(displayProgram);
            dailySchedule.appendChild(card);
        });
    }

    /**
     * Create schedule cell
     */
    createScheduleCell(date, time) {
        const cell = document.createElement('div');
        cell.className = 'schedule-cell';

        const program = this.getProgramForSlot(date, time);

        if (program) {
            const endTime = this.calculateEndTime(program.startTime, program.duration);
            const type = program.type || 'recorded';
            const contentType = program.contentType || 'playlist';
            const icon = contentType === 'video' ? '🎥' : '📺';
            
            cell.innerHTML = `
                <div class="schedule-program schedule-program--${type} schedule-content--${contentType}">
                    <div class="schedule-program__title">${icon} ${program.title || program.program}</div>
                    <div class="schedule-program__time">${program.startTime} - ${endTime}</div>
                    ${program.contentName ? `<div class="schedule-program__sub">${program.contentName}</div>` : ''}
                </div>
            `;
            
            const displayProgram = {
                ...program,
                endTime: endTime,
                program: program.title || program.program,
                date: date.toISOString().split('T')[0],
                type: type
            };
            
            cell.addEventListener('click', () => this.openProgramModal(displayProgram));
        }

        return cell;
    }

    /**
     * Create program card for daily view
     */
    createProgramCard(program) {
        const card = document.createElement('div');
        card.className = `program-card program-card--${program.type}`;
        const contentType = program.contentType || 'playlist';
        const icon = contentType === 'video' ? '🎥' : '📺';

        card.innerHTML = `
            <div class="program-card__time">${program.startTime} - ${program.endTime}</div>
            <h3 class="program-card__title">${icon} ${program.program}</h3>
            ${program.contentName ? `<div class="program-card__subtitle">Playing: ${program.contentName}</div>` : ''}
            <p class="program-card__description">${program.description}</p>
            <span class="program-card__type">${program.type || 'Recorded'}</span>
        `;

        card.addEventListener('click', () => this.openProgramModal(program));

        return card;
    }

    /**
     * Generate time slots (6 AM - 11 PM)
     */
    generateTimeSlots() {
        const slots = [];
        for (let hour = 6; hour <= 23; hour++) {
            slots.push(`${String(hour).padStart(2, '0')}:00`);
        }
        return slots;
    }

    /**
     * Get week days starting from current date
     */
    getWeekDays() {
        const days = [];
        const start = new Date(this.currentDate);
        start.setDate(start.getDate() - start.getDay()); // Start from Sunday

        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            days.push(day);
        }

        return days;
    }

    /**
     * Check if event occurs on a specific date
     */
    isEventOnDate(event, date) {
        const eventStart = new Date(event.startDate);
        const targetDate = new Date(date);
        targetDate.setHours(0,0,0,0);
        eventStart.setHours(0,0,0,0);

        // Event hasn't started yet
        if (targetDate < eventStart) return false;

        if (event.recurrence === 'none') {
            return targetDate.getTime() === eventStart.getTime();
        }
        if (event.recurrence === 'daily') {
            return true;
        }
        if (event.recurrence === 'weekly') {
            const day = targetDate.getDay();
            if (event.days && event.days.length) {
                // Handle both number and string types
                return event.days.includes(day) || event.days.includes(String(day));
            }
            // Fallback to start date's day if no specific days selected
            return day === eventStart.getDay();
        }
        if (event.recurrence === 'monthly') {
            return targetDate.getDate() === eventStart.getDate();
        }
        return false;
    }

    /**
     * Get program for a specific date and time slot
     */
    getProgramForSlot(date, timeSlot) {
        // timeSlot is "HH:00"
        // We look for events that start within this hour
        const slotHour = parseInt(timeSlot.split(':')[0]);
        
        return this.schedule.find(event => {
            if (!this.isEventOnDate(event, date)) return false;
            
            const [eventHour, eventMin] = event.startTime.split(':').map(Number);
            return eventHour === slotHour;
        });
    }

    /**
     * Calculate end time based on start time and duration
     */
    calculateEndTime(startTime, duration) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const totalMin = startHour * 60 + startMin + parseInt(duration);
        
        const endHour = Math.floor(totalMin / 60) % 24;
        const endMin = totalMin % 60;
        
        return `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    }

    /**
     * Initialize program modal
     */
    initProgramModal() {
        const modal = document.getElementById('programModal');
        const closeBtn = document.getElementById('closeModal');
        const backdrop = document.getElementById('modalBackdrop');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeProgramModal());
        }

        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeProgramModal());
        }
    }

    /**
     * Open program modal
     */
    openProgramModal(program) {
        const modal = document.getElementById('programModal');
        if (!modal) return;

        document.getElementById('programTitle').textContent = program.program;
        document.getElementById('programType').textContent = program.type;
        document.getElementById('programTime').textContent = `${program.startTime} - ${program.endTime}`;
        document.getElementById('programDate').textContent = Utils.formatDate(program.date);
        document.getElementById('programDuration').textContent = this.calculateDuration(program.startTime, program.endTime);
        document.getElementById('programDescription').textContent = program.description;

        modal.style.display = 'flex';
    }

    /**
     * Close program modal
     */
    closeProgramModal() {
        const modal = document.getElementById('programModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Calculate duration between two times
     */
    calculateDuration(startTime, endTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        const start = startHour * 60 + startMin;
        const end = endHour * 60 + endMin;
        const duration = end - start;

        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('schedule.html')) {
        window.scheduleManager = new ScheduleManager();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScheduleManager;
}
