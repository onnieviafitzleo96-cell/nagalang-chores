const SUPABASE_URL = "https://bwrxlbhikowzqagpaaxb.supabase.co";
const SUPABASE_KEY = "sb_publishable_qqyY3PPpU5D0WdBk0TpL7w_sz_82AKH";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const housemates = ["Via", "Ching", "Gimbo", "Gadi", "Igat"];
const choresList = [
    "Vacuum Stairs & Living Room", 
    "Mop Stairs & Living Room", 
    "Kitchen", 
    "Backyard & Garage", 
    "Dusting & Fridge"
];

const shuffleBtn = document.querySelector('.shuffle-btn');

// --- 1. THE REFRESH ENGINE ---
async function loadChores() {
    const board = document.getElementById('chore-board');
    
    let { data: chores, error } = await db.from('chores_status').select('*');
    if (error) return;

    board.innerHTML = ""; 

    if (chores.length === 0) {
        board.innerHTML = "<p>No chores assigned. Click Shuffle!</p>";
        shuffleBtn.disabled = false; // Enable if empty
        return;
    }

    // --- GREY OUT LOGIC ---
    // Check if at least one person has ticked a box
    const someoneFinished = chores.some(item => item.is_completed === true);
    if (someoneFinished) {
        shuffleBtn.disabled = true;
        shuffleBtn.innerText = "Chore in progress... (Locked)";
        shuffleBtn.style.opacity = "0.5";
        shuffleBtn.style.cursor = "not-allowed";
    } else {
        shuffleBtn.disabled = false;
        shuffleBtn.innerText = "Shuffle New Chores";
        shuffleBtn.style.opacity = "1";
        shuffleBtn.style.cursor = "pointer";
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

// --- 2. THE REAL-TIME MAGIC ---
// This tells the website: "If anything changes in the database, refresh for everyone!"
db.channel('custom-all-channel')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'chores_status' }, () => {
      loadChores();
  })
  .subscribe();

async function toggleChore(id, isChecked) {
    await db.from('chores_status').update({ is_completed: isChecked }).eq('id', id);
    // Note: The Real-time listener above will trigger loadChores() for everyone
}

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
shuffleBtn.addEventListener('click', shuffleChores);
