const projectNotes = {
      1: [
        { text: "Notes will appears here", date: "05/10/2025" }
      ],
      2: [
        { text: "Notes will appear here sjcbasdbddsbohlsdb sdcbdajBcLDCrsD/Csd/CDEQIdevadvs", date: "05/10/2025" }
      ],
      3: [
        { text: "Write note here...", date: "05/10/2025" }
      ]
    };

    // Current selected project
    let selectedProjectId = null;

    // Function to display notes for a project
    function displayNotes(projectId) {
      const notesContent = document.querySelector('.notes-content');
      const notes = projectNotes[projectId] || [];
      
      notesContent.innerHTML = '';
      
      if (notes.length === 0) {
        notesContent.innerHTML = '<div class="note-item"><p>No notes available for this project</p></div>';
        return;
      }
      
      notes.forEach(note => {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        noteItem.innerHTML = `
          <p>${note.text}</p>
          <div class="note-date">${note.date}</div>
        `;
        notesContent.appendChild(noteItem);
      });
    }

    // Add click event to table rows
    document.querySelectorAll('.table-container tbody tr').forEach(row => {
      row.addEventListener('click', function() {
        // Remove active class from all rows
        document.querySelectorAll('.table-container tbody tr').forEach(r => {
          r.classList.remove('active');
        });
        
        // Add active class to clicked row
        this.classList.add('active');
        
        // Get project ID and display notes
        const projectId = this.getAttribute('data-project-id');
        selectedProjectId = projectId;
        displayNotes(projectId);
      });
    });

    // Add note functionality
    document.querySelector('.notes-input button').addEventListener('click', function() {
      const noteTextarea = document.querySelector('.notes-input textarea');
      const noteText = noteTextarea.value.trim();
      
      if (noteText && selectedProjectId) {
        // Add note to the data
        if (!projectNotes[selectedProjectId]) {
          projectNotes[selectedProjectId] = [];
        }
        
        const currentDate = new Date().toLocaleDateString();
        projectNotes[selectedProjectId].push({
          text: noteText,
          date: currentDate
        });
        
        // Update display
        displayNotes(selectedProjectId);
        
        // Clear textarea
        noteTextarea.value = '';
      } else if (!selectedProjectId) {
        alert('Please select a project first');
      }
    });

    // Search functionality
    document.querySelectorAll('.search-box input').forEach(input => {
      input.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('.table-container tbody tr');
        
        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          if (text.includes(searchTerm)) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
      });
    });

    // Edit and Remove button functionality
    document.querySelectorAll('.btn-edit').forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent row click event
        alert('Edit functionality will be implemented with a popup form');
      });
    });

    document.querySelectorAll('.btn-remove').forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent row click event
        if (confirm('Are you sure you want to remove this project?')) {
          alert('Project removed successfully');
        }
      });
    });

    // Navigation menu functionality
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', function() {
        document.querySelectorAll('.nav-item').forEach(i => {
          i.classList.remove('active');
        });
        this.classList.add('active');
      });
    });