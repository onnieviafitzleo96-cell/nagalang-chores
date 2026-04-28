const SUPABASE_URL = "https://bwrxlbhikowzqagpaaxb.supabase.co";
const SUPABASE_KEY = "sb_publishable_qqyY3PPpU5D0WdBk0TpL7w_sz_82AKH";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const housemates = ["Via", "Ching", "Gimbo", "Gadi", "Igat"];
const choresList = ["Vacuum Stairs & Living Room", "Mop Stairs & Living Room", "Kitchen", "Backyard & Garage", "Dusting & Fridge"];

async function loadChores() {
    const board = document.getElementById('chore-board');
    const shuffleBtn = document.getElementById('shuffleBtn');
    
    let { data: chores, error } = await db.from('chores_status').select('*');
    
    if (error) {
        board.innerHTML = "<p style='color:red'>Database Error. Try refreshing!</p>";
        return;
    }

    board.innerHTML = ""; 

    if (chores.length === 0) {
        board.innerHTML = "<p>No chores yet. Click Shuffle!</p>";
        shuffleBtn.disabled = false;
        shuffleBtn.innerText = "Shuffle New Chores";
        return;
    }

    // --- NEW LOCKING LOGIC ---
    const allDone = chores.every(c => c.is_completed === true);
    const someDone = chores.some(c => c.is_completed === true);

    if (someDone && !allDone) {
        // Some are done but not all: LOCK IT
        shuffleBtn.disabled = true;
        shuffleBtn.innerText = "Locked (Finish all chores!)";
        shuffleBtn.style.opacity = "0.5";
    } else if (allDone) {
        // Everything is finished: UNLOCK for next week
        shuffleBtn.disabled = false;
        shuffleBtn.innerText = "Start New Week 🚀";
        shuffleBtn.style.opacity = "1";
    } else {
        // Nothing is done yet: Allow a re-shuffle if needed
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
        await db.from('chores_status').update({ is_completed: isChecked }).eq('task_name', taskName);
    }

    saveBtn.innerText = "Saved!";
    setTimeout(() => { saveBtn.innerText = "Save Progress"; }, 2000);
    loadChores();
}

async function shuffleChores() {
    const confirmMsg = "Move to next week? This will rotate chores to different people.";
    if (!confirm(confirmMsg)) return;

    // 1. Get current assignments to see who is doing what right now
    let { data: currentChores } = await db.from('chores_status').select('*');
    
    let newAssignments = [];

    if (currentChores && currentChores.length > 0) {
        // 2. SMART ROTATION: Move everyone to the next chore in the list
        // We find current people in order of our choresList
        let currentPeople = choresList.map(cName => {
            const found = currentChores.find(c => c.task_name === cName);
            return found ? found.assigned_to : null;
        });

        // Shift the array: take the last person and move them to the front
        // [A, B, C, D, E] becomes [E, A, B, C, D]
        let rotatedPeople = [...currentPeople];
        rotatedPeople.unshift(rotatedPeople.pop());

        newAssignments = choresList.map((chore, index) => ({
            task_name: chore,
            assigned_to: rotatedPeople[index],
            is_completed: false
        }));
    } else {
        // 3. FIRST TIME SHUFFLE: If database is empty, do a random shuffle
        let shuffledNames = [...housemates].sort(() => Math.random() - 0.5);
        newAssignments = choresList.map((chore, index) => ({
            task_name: chore,
            assigned_to: shuffledNames[index % shuffledNames.length],
            is_completed: false
        }));
    }

    // 4. Update Database
    await db.from('chores_status').delete().neq('task_name', 'empty_placeholder'); 
    await db.from('chores_status').insert(newAssignments);
    loadChores();
}

window.addEventListener('load', () => {
    loadChores();
    document.getElementById('saveBtn').addEventListener('click', saveChores);
    document.getElementById('shuffleBtn').addEventListener('click', shuffleChores);
});
