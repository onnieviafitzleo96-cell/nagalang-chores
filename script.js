// --- CONFIGURATION (Change these names!) ---
const housemates = ["Via", "Ching", "Gimbo", "Gadi", "Igat"];
const chores = ["Vacuum Stairs & Living Room", "Mop Stairs & Living Room", "Kitchen", "Backyard & Garage", "Dusting & Fridge"];

// --- THE LOGIC ---
function shuffleChores() {
    const board = document.getElementById('chore-board');
    board.innerHTML = ""; // This clears the "Loading..." text

    // 1. Shuffle the names randomly
    let shuffledNames = [...housemates].sort(() => Math.random() - 0.5);

    // 2. Assign chores to people
    chores.forEach((chore, index) => {
        // This math ensures even if you have more chores than people, everyone gets a turn
        const person = shuffledNames[index % shuffledNames.length];
        
        // 3. Create the "Card" with the checkbox
        const card = document.createElement('div');
        card.className = 'chore-card';
        card.innerHTML = `
            <input type="checkbox" id="chore-${index}">
            <label for="chore-${index}">
                <strong>${chore}</strong> <br>
                <span>Assigned to: ${person}</span>
            </label>
        `;
        board.appendChild(card);
    });
}

// This tells the browser: "The moment the page finishes loading, run the shuffle!"
window.onload = shuffleChores;

// This connects your button to the shuffle function
document.querySelector('.shuffle-btn').addEventListener('click', shuffleChores);
