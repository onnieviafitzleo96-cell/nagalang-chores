const SUPABASE_URL = "https://bwrxlbhikowzqagpaaxb.supabase.co";
const SUPABASE_KEY = "sb_publishable_qqyY3PPpU5D0WdBk0TpL7w_sz_82AKH";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const housemates = ["Via", "Ching", "Gimbo", "Gadi", "Igat"];
const choresList = ["Vacuum Stairs & Living Room", "Mop Stairs & Living Room", "Kitchen", "Backyard & Garage", "Dusting & Fridge"];

async function loadChores() {
    const board = document.getElementById('chore-board');
    const shuffleBtn = document.getElementById('shuffleBtn');
    
    // We removed .order('id') because your table uses 'task_name' as the key
    let { data: chores, error } = await db.from('chores_status').select('*');
    
    if (error) {
        console.error(error);
        board.innerHTML = "<p style='color:red'>Database Error: " + error.message + "</p>";
        return;
    }

    board.innerHTML = ""; 

    if (chores.length === 0) {
        board.innerHTML = "<p>No chores yet. Click Shuffle!</p>";
        shuffleBtn.disabled = false;
        return;
    }

    const anyDone = chores.some(c => c.is_completed === true);
    if (anyDone) {
        shuffleBtn.disabled = true;
        shuffleBtn.innerText = "Locked (Chore in Progress)";
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
                <span style="font-size: 13px; color: #777;">Assigned to: ${item.assigned_to}</span>
            </label>
        `;
        board.appendChild(card);
    });
}

async function saveChores() {
    const checkboxes = document.querySelectorAll('.chore-checkbox');
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.innerText = "Saving...";

    for (let cb of checkboxes) {
        const taskName = cb.getAttribute('data-name');
        const isChecked = cb.checked;
        
        // We now use 'task_name' to find the right row to update
        await db.from('chores_status')
            .update({ is_completed: isChecked })
            .eq('task_name', taskName);
    }

    saveBtn.innerText = "Saved!";
    setTimeout(() => { saveBtn.innerText = "Save Progress"; }, 2000);
    loadChores();
}

async function shuffleChores() {
    if (confirm("Reset and shuffle new chores for the week?")) {
        let shuffledNames = [...housemates].sort(() => Math.random() - 0.5);
        const newAssignments = choresList.map((chore, index) => ({
            task_name: chore,
            assigned_to: shuffledNames[index % shuffledNames.length],
            is_completed: false
        }));

        // Delete all and insert new
        await db.from('chores_status').delete().neq('task_name', 'empty_placeholder'); 
        await db.from('chores_status').insert(newAssignments);
        loadChores();
    }
}

window.addEventListener('load', () => {
    loadChores();
    document.getElementById('saveBtn').addEventListener('click', saveChores);
    document.getElementById('shuffleBtn').addEventListener('click', shuffleChores);
});
