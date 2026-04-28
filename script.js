const SUPABASE_URL = "https://bwrxlbhikowzqagpaaxb.supabase.co";
const SUPABASE_KEY = "sb_publishable_qqyY3PPpU5D0WdBk0TpL7w_sz_82AKH";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const housemates = ["Via", "Ching", "Gimbo", "Gadi", "Igat"];
const choresList = ["Vacuum Stairs & Living Room", "Mop Stairs & Living Room", "Kitchen", "Backyard & Garage", "Dusting & Fridge"];

async function loadChores() {
    const board = document.getElementById('chore-board');
    const shuffleBtn = document.getElementById('shuffleBtn');
    let { data: chores, error } = await db.from('chores_status').select('*');
    if (error) return;

    board.innerHTML = ""; 
    const allDone = chores.every(c => c.is_completed === true);
    const someDone = chores.some(c => c.is_completed === true);

    if (someDone && !allDone) {
        shuffleBtn.disabled = true;
        shuffleBtn.innerText = "Locked (Finish all chores!)";
    } else if (allDone) {
        shuffleBtn.disabled = false;
        shuffleBtn.innerText = "Start New Week 🚀";
    } else {
        shuffleBtn.disabled = false;
        shuffleBtn.innerText = "Shuffle New Chores";
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

// --- UPDATED SAVE FUNCTION WITH WHATSAPP ---
async function saveChores() {
    const checkboxes = document.querySelectorAll('.chore-checkbox');
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.innerText = "Saving...";

    let completedUpdates = [];

    for (let cb of checkboxes) {
        const taskName = cb.getAttribute('data-name');
        const isChecked = cb.checked;
        
        // Find the person assigned to this specific task
        const personName = cb.nextElementSibling.querySelector('.assignee-text').innerText.replace('Assigned to: ', '');
        
        if (isChecked) {
            completedUpdates.push(`✅ *${personName}* finished *${taskName}*`);
        }

        await db.from('chores_status').update({ is_completed: isChecked }).eq('task_name', taskName);
    }

    saveBtn.innerText = "Saved!";

    // If something was checked, ask to notify the group
    if (completedUpdates.length > 0) {
        const header = "🏠 *Nagalang Chores Update* \n\n";
        const footer = "\n\nCheck the live board here: " + window.location.href;
        const fullMessage = encodeURIComponent(header + completedUpdates.join("\n") + footer);
        
        // This opens the WhatsApp Share screen
        const whatsappUrl = `https://api.whatsapp.com/send?text=${fullMessage}`;
        
        if (confirm("Progress saved! Open WhatsApp to notify the group?")) {
            window.open(whatsappUrl, '_blank');
        }
    }

    setTimeout(() => { saveBtn.innerText = "Save Progress"; }, 2000);
    loadChores();
}

async function shuffleChores() {
    if (!confirm("Rotate chores for the new week?")) return;
    let { data: currentChores } = await db.from('chores_status').select('*');
    let newAssignments = [];

    if (currentChores && currentChores.length > 0) {
        let currentPeople = choresList.map(cName => {
            const found = currentChores.find(c => c.task_name === cName);
            return found ? found.assigned_to : null;
        });
        let rotatedPeople = [...currentPeople];
        rotatedPeople.unshift(rotatedPeople.pop());
        newAssignments = choresList.map((chore, index) => ({
            task_name: chore,
            assigned_to: rotatedPeople[index],
            is_completed: false
        }));
    } else {
        let shuffledNames = [...housemates].sort(() => Math.random() - 0.5);
        newAssignments = choresList.map((chore, index) => ({
            task_name: chore,
            assigned_to: shuffledNames[index % shuffledNames.length],
            is_completed: false
        }));
    }

    await db.from('chores_status').delete().neq('task_name', 'placeholder'); 
    await db.from('chores_status').insert(newAssignments);
    loadChores();
}

window.addEventListener('load', () => {
    loadChores();
    document.getElementById('saveBtn').addEventListener('click', saveChores);
    document.getElementById('shuffleBtn').addEventListener('click', shuffleChores);
});
