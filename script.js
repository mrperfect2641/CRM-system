const projectNotes = {
      1: [
        { text: "Notes will appears here", date: "05/10/2025" }
      ],
      2: [
        { text: "Notes will appear here sjcbasdbddsbohlsdb sdcbdajBcLDCrsD/Csd/CDEQIdevadvs", date: "05/10/2025" }
      ],
      3: [
        { text: "Write note here...", date: "05/10/2025" }
      ],
      4: [
        { text: "E-commerce platform development in progress", date: "06/15/2025" }
      ],
      5: [
        { text: "Waiting for client approval on design", date: "07/01/2025" }
      ],
      6: [
        { text: "CRM system successfully deployed", date: "04/20/2025" }
      ],
      7: [
        { text: "Dashboard design in progress", date: "08/10/2025" }
      ],
      8: [
        { text: "API integration pending third-party response", date: "09/05/2025" }
      ]
    };

    // Current selected project
    let selectedProjectId = null;

    // Projects table scroll functionality
    function initializeProjectsTableScroll() {
      const tableContainer = document.getElementById('projectsTableContainer');
      const showMoreIndicator = document.getElementById('showMoreIndicator');
      const rows = tableContainer.querySelectorAll('tbody tr');
      
      // Show only first 5 rows initially
      rows.forEach((row, index) => {
        if (index >= 5) {
          row.style.display = 'none';
        }
      });
      
      // Add scroll event listener
      tableContainer.addEventListener('scroll', function() {
        const scrollTop = tableContainer.scrollTop;
        const scrollHeight = tableContainer.scrollHeight;
        const clientHeight = tableContainer.clientHeight;
        
        // If user scrolls near the bottom, show all rows
        if (scrollTop + clientHeight >= scrollHeight - 10) {
          tableContainer.classList.add('scroll-active');
          showMoreIndicator.style.display = 'none';
          
          // Show all rows
          rows.forEach(row => {
            row.style.display = 'table-row';
          });
        }
      });
      
      // Click event for show more indicator
      showMoreIndicator.addEventListener('click', function() {
        tableContainer.scrollBy({ top: 100, behavior: 'smooth' });
      });
    }

    // Function to update status box counts
    function updateStatusCounts() {
      const rows = document.querySelectorAll('.projects-table-container tbody tr');
      let allCount = 0;
      let pendingCount = 0;
      let waitingCount = 0;
      let completedCount = 0;
      
      rows.forEach(row => {
        // Only count rows that are visible (not filtered out by search)
        if (row.style.display !== 'none' && row.offsetParent !== null) {
          allCount++;
          const statusElement = row.querySelector('.status');
          if (statusElement) {
            const status = statusElement.textContent.trim().toLowerCase();
            if (status === 'completed') {
              completedCount++;
            } else if (status === 'in process') {
              pendingCount++;
            } else if (status === 'waiting') {
              waitingCount++;
            }
          }
        }
      });
      
      // Update the counts in the status boxes
      document.querySelector('.all-projects .count').textContent = allCount;
      document.querySelector('.pending .count').textContent = pendingCount;
      document.querySelector('.waiting .count').textContent = waitingCount;
      document.querySelector('.completed .count').textContent = completedCount;
    }

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
    document.querySelectorAll('.projects-table-container tbody tr').forEach(row => {
      row.addEventListener('click', function() {
        // Remove active class from all rows
        document.querySelectorAll('.projects-table-container tbody tr').forEach(r => {
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
        const rows = document.querySelectorAll('.projects-table-container tbody tr');
        
        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          if (text.includes(searchTerm)) {
            row.style.display = 'table-row';
          } else {
            row.style.display = 'none';
          }
        });
        
        // Update counts after filtering
        updateStatusCounts();
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

    // Initialize table scroll when page loads
    document.addEventListener('DOMContentLoaded', function() {
      updateStatusCounts();
      initializeProjectsTableScroll();
    });