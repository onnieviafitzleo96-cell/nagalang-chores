const SUPABASE_URL = "https://bwrxlbhikowzqagpaaxb.supabase.co";
const SUPABASE_KEY = "sb_publishable_qqyY3PPpU5D0WdBk0TpL7w_sz_82AKH";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const housemates = ["Via", "Ching", "Gimbo", "Gadi", "Igat"];
const choresList = ["Vacuum Stairs & Living Room", "Mop Stairs & Living Room", "Kitchen", "Backyard & Garage", "Dusting & Fridge"];

const shuffleBtn = document.querySelector('.shuffle-btn');

// 1. LOAD FROM DATABASE
async function loadChores() {
    const board = document.getElementById('chore-board');
    let { data: chores, error } = await db.from('chores_status').select('*').order('id', { ascending: true });

    if (error || !chores) return;

    board.innerHTML = ""; 

    // Lock Shuffle button if any chore is already ticked in the database
    const anyDone = chores.some(c => c.is_completed);
    if (anyDone) {
        shuffleBtn.disabled = true;
        shuffleBtn.innerText = "Locked (Chore in Progress)";
        shuffleBtn.style.opacity = "0.5";
    } else {
        shuffleBtn.disabled = false;
        shuffleBtn.innerText = "Shuffle New Chores";
        shuffleBtn.style.opacity = "1";
    }

    chores.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'chore-card';
        card.innerHTML = `
            <input type="checkbox" class="chore-checkbox" data-id="${item.id}" ${item.is_completed ? 'checked' : ''}>
            <label>
                <strong>${item.task_name}</strong> <br>
                <span>Assigned to: ${item.assigned_to}</span>
            </label>
        `;
        board.appendChild(card);
    });
}

// 2. SAVE ALL TICKS TO DATABASE
async function saveChores() {
    const checkboxes = document.querySelectorAll('.chore-checkbox');
    const saveBtn = document.querySelector('.save-btn');
    
    saveBtn.innerText = "Saving...";

    for (let cb of checkboxes) {
        const id = cb.getAttribute('data-id');
        const isChecked = cb.checked;

        await db.from('chores_status')
            .update({ is_completed: isChecked })
            .eq('id', id);
    }

    saveBtn.innerText = "Saved!";
    setTimeout(() => { saveBtn.innerText = "Save Progress"; }, 2000);
    
    loadChores(); // Refresh to update Shuffle button status
}

// 3. SHUFFLE (ONLY WORKS IF NO TICKS SAVED)
async function shuffleChores() {
    let shuffledNames = [...housemates].sort(() => Math.random() - 0.5);
    const newAssignments = choresList.map((chore, index) => ({
        task_name: chore,
        assigned_to: shuffledNames[index % shuffledNames.length],
        is_completed: false
    }));

    await db.from('chores_status').delete().neq('id', 0); 
    await db.from('chores_status').insert(newAssignments);
    loadChores(); 
}

window.onload = loadChores;
