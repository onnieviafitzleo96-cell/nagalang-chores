const SUPABASE_URL = "https://bwrxlbhikowzqagpaaxb.supabase.co";
const SUPABASE_KEY = "sb_publishable_qqyY3PPpU5D0WdBk0TpL7w_sz_82AKH";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const housemates = ["Via", "Ching", "Gimbo", "Gadi", "Igat"];
const choresList = ["Vacuum Stairs & Living Room", "Mop Stairs & Living Room", "Kitchen", "Backyard & Garage", "Dusting & Fridge"];

async function loadChores() {
    const board = document.getElementById('chore-board');
    const shuffleBtn = document.getElementById('shuffleBtn');
    
    let { data: chores, error } = await db.from('chores_status').select('*').order('id', { ascending: true });
    
    if (error) {
        board.innerHTML = "<p style='color:red'>Cloud Error. Check Supabase RLS!</p>";
        return;
    }

    board.innerHTML = ""; 

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
            <input type="checkbox" class="chore-checkbox" data-id="${item.id}" ${item.is_completed ? 'checked' : ''}>
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
        const id = cb.getAttribute('data-id');
        const isChecked = cb.checked;
        await db.from('chores_status').update({ is_completed: isChecked }).eq('id', id);
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

        await db.from('chores_status').delete().neq('id', 0); 
        await db.from('chores_status').insert(newAssignments);
        loadChores();
    }
}

// Attach events when the page loads
window.addEventListener('load', () => {
    loadChores();
    document.getElementById('saveBtn').addEventListener('click', saveChores);
    document.getElementById('shuffleBtn').addEventListener('click', shuffleChores);
});
