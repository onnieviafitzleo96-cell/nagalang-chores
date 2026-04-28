const SUPABASE_URL = "https://bwrxlbhikowzqagpaaxb.supabase.co";
const SUPABASE_KEY = "sb_publishable_qqyY3PPpU5D0WdBk0TpL7w_sz_82AKH";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const housemates = ["Via", "Ching", "Gimbo", "Gadi", "Igat"];

const weeklyTasks = [
    "Vacuum Living Room & Stairs",
    "Mop Living Room & Stairs",
    "Kitchen: Sink & Dishes Rack",
    "Kitchen: Stove & Microwave/Oven",
    "Kitchen: Food Racks & Countertops",
    "Clean Windows",
    "Organize Fridge & Interior Racks",
    "Backyard Sweep & Tidy",
    "Garage Sweep & Tidy",
    "Dusting: Ceilings, Walls, Fans & Spider Webs"
];

async function loadChores() {
    const board = document.getElementById('chore-board');
    const shuffleBtn = document.getElementById('shuffleBtn');
    
    let { data: chores, error } = await db.from('chores_status').select('*');
    if (error) return;

    board.innerHTML = ""; 

    const allDone = chores.length > 0 && chores.every(c => c.is_completed === true);
    const someDone = chores.some(c => c.is_completed === true);

    if (someDone && !allDone) {
        shuffleBtn.disabled = true;
        shuffleBtn.innerText = "Locked (Finish all chores!)";
        shuffleBtn.style.opacity = "0.5";
    } else if (allDone && chores.length > 0) {
        shuffleBtn.disabled = false;
        shuffleBtn.innerText = "Start New Week 🚀";
        shuffleBtn.style.opacity = "1";
    } else {
        shuffleBtn.disabled = false;
        shuffleBtn.innerText = "Shuffle New Chores";
        shuffleBtn.style.opacity = "1";
    }

    chores.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'chore-card';
        card.innerHTML = `
            <input type="checkbox" class="chore-checkbox" data-name="${item.task_name}" ${item.is_completed ? 'checked' : ''}>
            <label style="flex:1; cursor:pointer">
                <strong>${item.task_name}</strong> <br>
                <span class="assignee-text">Assigned to: ${item.assigned_to}</span>
            </label>
        `;
        board.appendChild(card);
    });
}

async function saveChores() {
    const checkboxes = document.querySelectorAll('.chore-checkbox');
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.innerText = "Saving...";

    let completedUpdates = [];

    for (let cb of checkboxes) {
        const taskName = cb.getAttribute('data-name');
        const isChecked = cb.checked;
        const label = cb.nextElementSibling;
        const personName = label.querySelector('.assignee-text').innerText.replace('Assigned to: ', '');
        
        if (isChecked) completedUpdates.push(`✅ *${personName}* finished *${taskName}*`);

        await db.from('chores_status').update({ is_completed: isChecked }).eq('task_name', taskName);
    }

    saveBtn.innerText = "Saved!";

    if (completedUpdates.length > 0) {
        const header = "🏠 *Nagalang Chores Update* \n\n";
        const footer = "\n\nBoard: " + window.location.href;
        const fullMessage = encodeURIComponent(header + completedUpdates.join("\n") + footer);
        const isMobile = /iPhone|Android|iPad/i.test(navigator.userAgent);
        const whatsappUrl = isMobile ? `whatsapp://send?text=${fullMessage}` : `https://wa.me/?text=${fullMessage}`;
        
        if (confirm("Progress saved! Notify the group?")) {
            if (isMobile) window.location.href = whatsappUrl;
            else window.open(whatsappUrl, '_blank');
        }
    }

    setTimeout(() => { 
        saveBtn.innerText = "Save Progress"; 
        loadChores();
    }, 2000);
}

async function shuffleChores() {
    if (!confirm("Rotate chores for the new week?")) return;

    let { data: settings } = await db.from('app_settings').select('shuffle_count').eq('id', 1).single();
    let nextCount = (settings ? settings.shuffle_count : 0) + 1;

    let rotatedNames = [...housemates];
    for (let i = 0; i < (nextCount % housemates.length); i++) {
        rotatedNames.push(rotatedNames.shift());
    }

    const newAssignments = weeklyTasks.map((chore, index) => ({
        task_name: chore,
        assigned_to: rotatedNames[index % rotatedNames.length],
        is_completed: false
    }));

    await db.from('chores_status').delete().neq('task_name', 'placeholder'); 
    await db.from('chores_status').insert(newAssignments);
    await db.from('app_settings').update({ shuffle_count: nextCount }).eq('id', 1);

    loadChores();
}

window.addEventListener('load', () => {
    loadChores();
    document.getElementById('saveBtn').addEventListener('click', saveChores);
    document.getElementById('shuffleBtn').addEventListener('click', shuffleChores);
});
