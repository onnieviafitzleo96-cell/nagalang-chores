// --- DATABASE CONNECTION ---
// Paste your specific details here again:
const SUPABASE_URL = "https://bwrxlbhikowzqagpaaxb.supabase.co";
const SUPABASE_KEY = "sb_publishable_qqyY3PPpU5D0WdBk0TpL7w_sz_82AKH";

// We changed 'supabase' to 'db' here to avoid a naming conflict
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- YOUR HOUSE SETTINGS ---
const housemates = ["Via", "Ching", "Gimbo", "Gadi", "Igat"];
const choresList = [
    "Vacuum Stairs & Living Room", 
    "Mop Stairs & Living Room", 
    "Kitchen", 
    "Backyard & Garage", 
    "Dusting & Fridge"
];

// --- 1. LOAD DATA FROM CLOUD ---
async function loadChores() {
    const board = document.getElementById('chore-board');
    board.innerHTML = "Connecting to Nagalang Cloud...";

    let { data: chores, error } = await db.from('chores_status').select('*');

    if (error) {
        console.error("Error loading:", error);
        board.innerHTML = "Error: Check your Supabase table settings!";
        return;
    }

    board.innerHTML = ""; 

    if (chores.length === 0) {
        board.innerHTML = "<p>No chores assigned yet. Click Shuffle!</p>";
    }

    chores.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'chore-card';
        card.innerHTML = `
            <input type="checkbox" id="check-${item.id}" ${item.is_completed ? 'checked' : ''}>
            <label for="check-${item.id}">
                <strong>${item.task_name}</strong> <br>
                <span>Assigned to: ${item.assigned_to}</span>
            </label>
        `;
        
        const checkbox = card.querySelector('input');
        checkbox.addEventListener('change', () => toggleChore(item.id, checkbox.checked));
        
        board.appendChild(card);
    });
}

// --- 2. SAVE TICK-BOX TO CLOUD ---
async function toggleChore(id, isChecked) {
    await db
        .from('chores_status')
        .update({ is_completed: isChecked })
        .eq('id', id);
}

// --- 3. SHUFFLE & RESET CLOUD ---
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
document.querySelector('.shuffle-btn').addEventListener('click', shuffleChores);
