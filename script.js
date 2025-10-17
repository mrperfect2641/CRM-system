// =============================================
// CRM DASHBOARD - MAIN JAVASCRIPT FILE
// =============================================

// ===== SUPABASE CONFIGURATION =====
const SUPABASE_URL = 'https://kqaqnhbdqnflbpjhrazq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYXFuaGJkcW5mbGJwamhyYXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTIyMTksImV4cCI6MjA3NTY4ODIxOX0.5tAfWDw2gnkrgICmOr0ZQ8EiPG3aLMQ5TxuCuBUI5sU';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== GLOBAL VARIABLES =====
let projects = [];
let portfolioImages = [];
let skills = [];
let updates = [];
let todos = [];
let selectedProjectId = null;
let editProjectId = null;
let editPortfolioImageId = null;
let editSkillId = null;
let editUpdateId = null;
let editTodoId = null;
let currentPortfolioImageFile = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing CRM Dashboard...');
    initializeApp();
});

/**
 * Initialize the entire application
 */
async function initializeApp() {
    showLoading();
    
    await Promise.all([
        loadProjects(),
        initializePortfolioImages(),
        initializeSkills(),
        initializeUpdates(),
        initializeTodoList(),
        initializePortfolioAnalytics()
    ]);
    
    updateStatusCounts();
    initializeProjectsTableScroll();
    setupEventListeners();
    setupSectionSwitching();
    
    hideLoading();
}

// ===== LOADING FUNCTIONS =====
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// ===== FREELANCE PROJECTS FUNCTIONS =====

/**
 * Load projects from Supabase database
 */
async function loadProjects() {
    try {
        console.log('Loading projects from Supabase...');
        const { data, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error loading projects:', error);
            throw error;
        }

        console.log(`Loaded ${data?.length || 0} projects`);
        projects = data || [];
        initializeProjectsTable();
        
    } catch (error) {
        console.error('Error loading projects:', error);
        alert('Error loading projects: ' + error.message);
    }
}

/**
 * Initialize projects table with loaded data
 */
function initializeProjectsTable() {
    const tableBody = document.getElementById('projectsTableBody');
    tableBody.innerHTML = '';
    
    if (projects.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #999; padding: 40px;">
                    No projects found. Click "Add Project" to create your first project.
                </td>
            </tr>
        `;
        return;
    }
    
    projects.forEach((project, index) => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-project-id', project.id);
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(project.name)}</td>
            <td>${escapeHtml(project.client)}</td>
            <td>${formatDisplayDate(project.start_date)}</td>
            <td><span class="status ${project.status}">${getStatusText(project.status)}</span></td>
            <td class="actions">
                <button class="btn btn-edit" data-project-id="${project.id}">Edit</button>
                <button class="btn btn-remove" data-project-id="${project.id}">Remove</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    
    setupProjectRowClickEvents();
}

/**
 * Setup click events for project table rows
 */
function setupProjectRowClickEvents() {
    document.querySelectorAll('.projects-table-container tbody tr').forEach(row => {
        row.addEventListener('click', function() {
            selectProject(this.getAttribute('data-project-id'));
        });
    });
}

// ===== PORTFOLIO IMAGES FUNCTIONS =====

/**
 * Initialize portfolio images functionality
 */
async function initializePortfolioImages() {
    await loadPortfolioImages();
    setupPortfolioImagesEventListeners();
}

/**
 * Load portfolio images from Supabase
 */
async function loadPortfolioImages() {
    try {
        const { data, error } = await supabaseClient
            .from('portfolio_images')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        portfolioImages = data || [];
        renderPortfolioImages();
        
    } catch (error) {
        console.error('Error loading portfolio images:', error);
    }
}

/**
 * Render portfolio images to the container
 */
function renderPortfolioImages() {
    const container = document.getElementById('portfolioImagesContainer');
    if (!container) return;
    
    container.innerHTML = '';

    if (portfolioImages.length === 0) {
        container.innerHTML = `
            <div class="no-images">
                <i class="fas fa-image" style="font-size: 48px; color: #bdc3c7; margin-bottom: 10px;"></i>
                <p style="color: #7f8c8d; text-align: center;">No portfolio images yet. Click "Add Image" to get started.</p>
            </div>
        `;
        return;
    }

    portfolioImages.forEach((image) => {
        const imageElement = createPortfolioImageElement(image);
        container.appendChild(imageElement);
    });

    initializePortfolioImagesScroll();
}

/**
 * Create HTML element for portfolio image
 */
function createPortfolioImageElement(image) {
    const div = document.createElement('div');
    div.className = 'portfolio-image-item';
    div.setAttribute('data-image-id', image.id);
    
    const imageUrl = image.image_url || '';
    const hasImage = imageUrl && imageUrl !== '';
    
    div.innerHTML = `
        <div class="portfolio-image-preview">
            ${hasImage ? 
                `<img src="${imageUrl}" alt="${escapeHtml(image.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" loading="lazy">
                 <div class="placeholder" style="display: none;"><i class="fas fa-image"></i></div>` :
                `<div class="placeholder"><i class="fas fa-image"></i></div>`
            }
        </div>
        <div class="portfolio-image-info">
            <h4>${escapeHtml(image.title || 'Untitled Image')}</h4>
            <div class="portfolio-image-details">
                <div class="portfolio-image-url">
                    <a href="${image.url}" target="_blank" rel="noopener noreferrer">
                        ${image.url}
                    </a>
                </div>
                <div class="portfolio-image-size">${escapeHtml(image.size || 'No size specified')}</div>
            </div>
        </div>
        <div class="portfolio-image-actions">
            <button class="btn btn-edit btn-sm" data-image-id="${image.id}">Edit</button>
            <button class="btn btn-remove btn-sm" data-image-id="${image.id}">Remove</button>
        </div>
    `;
    
    return div;
}

// ===== EVENT LISTENERS SETUP =====

/**
 * Setup all event listeners for the application
 */
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    setupSearchFunctionality();
    setupNotesFunctionality();
    setupProjectModalEvents();
    setupSkillsEventListeners();
    setupUpdatesEventListeners();
}

/**
 * Setup search functionality
 */
function setupSearchFunctionality() {
    document.getElementById('searchInput').addEventListener('input', function(e) {
        filterProjects(e.target.value);
    });
}

/**
 * Setup notes functionality
 */
function setupNotesFunctionality() {
    document.getElementById('addNoteBtn').addEventListener('click', addNote);
    
    document.getElementById('noteTextarea').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addNote();
        }
    });
    
    document.getElementById('projectsTableContainer').addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-edit')) {
            e.stopPropagation();
            editProject(e.target.getAttribute('data-project-id'));
        } else if (e.target.classList.contains('btn-remove')) {
            e.stopPropagation();
            removeProject(e.target.getAttribute('data-project-id'));
        }
    });
}

/**
 * Setup project modal events
 */
function setupProjectModalEvents() {
    const openBtn = document.getElementById('open-project-btn');
    const overlay = document.getElementById('pjOverlay');
    const cancelBtn = document.getElementById('project-cancel-btn');
    const form = document.getElementById('project-form');
    
    if (openBtn) {
        openBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openProjectModal();
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeProjectModal();
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeProjectModal();
        });
    }
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handleProjectSubmit(e);
        });
    }
}

/**
 * Setup portfolio images event listeners
 */
function setupPortfolioImagesEventListeners() {
    console.log('Setting up portfolio images event listeners...');
    
    const addImageBtn = document.getElementById('addPortfolioImageBtn');
    if (addImageBtn) {
        addImageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openPortfolioImageModal();
        });
    }
    
    const overlay = document.getElementById('portfolioImageOverlay');
    const cancelBtn = document.getElementById('portfolioImageCancel');
    const form = document.getElementById('portfolio-image-form');
    
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closePortfolioImageModal();
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closePortfolioImageModal();
        });
    }
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handlePortfolioImageSubmit(e);
        });
    }
    
    setupImageUploadEvents();
    
    const container = document.getElementById('portfolioImagesContainer');
    if (container) {
        container.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-edit')) {
                e.stopPropagation();
                editPortfolioImage(e.target.getAttribute('data-image-id'));
            } else if (e.target.classList.contains('btn-remove')) {
                e.stopPropagation();
                removePortfolioImage(e.target.getAttribute('data-image-id'));
            }
        });
    }
}

/**
 * Setup image upload events
 */
function setupImageUploadEvents() {
    const uploadTrigger = document.getElementById('portfolioUploadTrigger');
    const imageInput = document.getElementById('portfolioImageInput');
    const imagePreview = document.getElementById('portfolioImagePreview');
    
    if (uploadTrigger) {
        uploadTrigger.addEventListener('click', () => {
            if (imageInput) imageInput.click();
        });
    }
    
    if (imageInput) {
        imageInput.addEventListener('change', handlePortfolioImageUpload);
    }
    
    if (imagePreview) {
        imagePreview.addEventListener('click', () => {
            if (imageInput) imageInput.click();
        });
    }
}

// ===== SECTION SWITCHING =====

/**
 * Setup section switching functionality
 */
function setupSectionSwitching() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            switchSection(targetSection);
        });
    });
}

/**
 * Switch between main sections
 */
function switchSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    const targetNavItem = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
    
    if (targetSection && targetNavItem) {
        targetSection.classList.remove('hidden');
        targetNavItem.classList.add('active');
    }
}

// ===== PROJECT MODAL FUNCTIONS =====

/**
 * Open project modal for adding/editing
 */
function openProjectModal(projectId = null) {
    const modal = document.getElementById('project-modal');
    const form = document.getElementById('project-form');
    const title = document.getElementById('pjTitle');
    
    if (!modal) return;
    
    if (projectId) {
        editProjectId = projectId;
        const project = projects.find(p => p.id == projectId);
        
        if (project) {
            title.textContent = 'Edit Project';
            document.getElementById('pj-name').value = project.name;
            document.getElementById('pj-client').value = project.client;
            document.getElementById('pj-start').value = project.start_date;
            document.getElementById('pj-status').value = project.status;
        }
    } else {
        editProjectId = null;
        title.textContent = 'New Project';
        form.reset();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('pj-start').value = today;
    }
    
    modal.classList.remove('hidden');
}

/**
 * Close project modal
 */
function closeProjectModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editProjectId = null;
}

/**
 * Handle project form submission
 */
async function handleProjectSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('pj-name').value.trim();
    const client = document.getElementById('pj-client').value.trim();
    const start = document.getElementById('pj-start').value;
    const status = document.getElementById('pj-status').value;
    
    if (!name || !client || !start) {
        alert('Please fill all fields');
        return;
    }
    
    showLoading();
    
    try {
        if (editProjectId) {
            const { error } = await supabaseClient
                .from('projects')
                .update({
                    name: name,
                    client: client,
                    start_date: start,
                    status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editProjectId);

            if (error) throw error;
        } else {
            const { error } = await supabaseClient
                .from('projects')
                .insert([{
                    name: name,
                    client: client,
                    start_date: start,
                    status: status
                }]);

            if (error) throw error;
        }
        
        await loadProjects();
        updateStatusCounts();
        closeProjectModal();
        
    } catch (error) {
        console.error('Error saving project:', error);
        alert('Error saving project: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ===== PORTFOLIO IMAGE MODAL FUNCTIONS =====

/**
 * Handle portfolio image upload
 */
function handlePortfolioImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    currentPortfolioImageFile = file;
    const preview = document.getElementById('portfolioImagePreview');
    
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            preview.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Open portfolio image modal
 */
function openPortfolioImageModal(imageId = null) {
    const modal = document.getElementById('portfolio-image-modal');
    const form = document.getElementById('portfolio-image-form');
    const title = document.getElementById('portfolioImageTitle');
    
    if (!modal) {
        console.error('Portfolio image modal element not found!');
        return;
    }
    
    if (imageId) {
        editPortfolioImageId = imageId;
        const image = portfolioImages.find(img => img.id == imageId);
        title.textContent = 'Edit Portfolio Image';
        document.getElementById('portfolioImageUrl').value = image.url || '';
        document.getElementById('portfolioImageSize').value = image.size || '';
        document.getElementById('portfolioImageTitleInput').value = image.title || '';
        
        const preview = document.getElementById('portfolioImagePreview');
        if (image.image_url) {
            preview.innerHTML = `<img src="${image.image_url}" alt="Preview">`;
            preview.classList.add('has-image');
        } else {
            preview.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Click to upload image</span>';
            preview.classList.remove('has-image');
        }
    } else {
        editPortfolioImageId = null;
        title.textContent = 'Add Portfolio Image';
        if (form) form.reset();
        const preview = document.getElementById('portfolioImagePreview');
        if (preview) {
            preview.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Click to upload image</span>';
            preview.classList.remove('has-image');
        }
        currentPortfolioImageFile = null;
    }
    
    modal.classList.remove('hidden');
}

/**
 * Close portfolio image modal
 */
function closePortfolioImageModal() {
    const modal = document.getElementById('portfolio-image-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editPortfolioImageId = null;
    currentPortfolioImageFile = null;
}

/**
 * Handle portfolio image form submission
 */
async function handlePortfolioImageSubmit(e) {
    e.preventDefault();
    
    const url = document.getElementById('portfolioImageUrl').value.trim();
    const size = document.getElementById('portfolioImageSize').value.trim();
    const title = document.getElementById('portfolioImageTitleInput').value.trim();
    
    if (!url || !size || !title) {
        alert('Please fill all fields');
        return;
    }
    
    showLoading();
    
    try {
        let imageUrl = '';
        
        if (currentPortfolioImageFile) {
            const fileName = `${Date.now()}-${currentPortfolioImageFile.name}`;
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('portfolio-images')
                .upload(fileName, currentPortfolioImageFile);
                
            if (uploadError) throw uploadError;
            
            const { data: urlData } = supabaseClient.storage
                .from('portfolio-images')
                .getPublicUrl(fileName);
                
            imageUrl = urlData.publicUrl;
        }
        
        if (editPortfolioImageId) {
            const updateData = {
                url: url,
                size: size,
                title: title,
                updated_at: new Date().toISOString()
            };
            
            if (currentPortfolioImageFile) {
                updateData.image_url = imageUrl;
            }
            
            const { error } = await supabaseClient
                .from('portfolio_images')
                .update(updateData)
                .eq('id', editPortfolioImageId);

            if (error) throw error;
        } else {
            const { error } = await supabaseClient
                .from('portfolio_images')
                .insert([{
                    url: url,
                    size: size,
                    title: title,
                    image_url: imageUrl
                }]);

            if (error) throw error;
        }
        
        await loadPortfolioImages();
        closePortfolioImageModal();
        
    } catch (error) {
        console.error('Error saving portfolio image:', error);
        alert('Error saving image: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ===== CRUD OPERATIONS =====

/**
 * Edit project
 */
function editProject(projectId) {
    openProjectModal(projectId);
}

/**
 * Remove project
 */
async function removeProject(projectId) {
    if (!confirm('Are you sure you want to remove this project?')) {
        return;
    }
    
    showLoading();
    
    try {
        const { error: notesError } = await supabaseClient
            .from('project_notes')
            .delete()
            .eq('project_id', projectId);

        if (notesError) throw notesError;

        const { error: projectError } = await supabaseClient
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (projectError) throw projectError;

        await loadProjects();
        updateStatusCounts();
        
        if (selectedProjectId == projectId) {
            selectedProjectId = null;
            document.getElementById('notesContent').innerHTML = '<div class="note-item"><p>Select a project to view notes</p></div>';
        }
        
    } catch (error) {
        console.error('Error removing project:', error);
        alert('Error removing project: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Edit portfolio image
 */
function editPortfolioImage(imageId) {
    openPortfolioImageModal(imageId);
}

/**
 * Remove portfolio image
 */
async function removePortfolioImage(imageId) {
    if (!confirm('Are you sure you want to remove this portfolio image?')) {
        return;
    }
    
    showLoading();
    
    try {
        const { error } = await supabaseClient
            .from('portfolio_images')
            .delete()
            .eq('id', imageId);

        if (error) throw error;

        await loadPortfolioImages();
        
    } catch (error) {
        console.error('Error removing portfolio image:', error);
        alert('Error removing image: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ===== NOTES FUNCTIONALITY =====

/**
 * Select project and display notes
 */
async function selectProject(projectId) {
    document.querySelectorAll('.projects-table-container tbody tr').forEach(r => {
        r.classList.remove('active');
    });
    
    const selectedRow = document.querySelector(`tr[data-project-id="${projectId}"]`);
    if (selectedRow) {
        selectedRow.classList.add('active');
    }
    
    selectedProjectId = projectId;
    await displayNotes(projectId);
}

/**
 * Load notes for a project
 */
async function loadNotes(projectId) {
    try {
        const { data, error } = await supabaseClient
            .from('project_notes')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error loading notes:', error);
        return [];
    }
}

/**
 * Display notes for selected project
 */
async function displayNotes(projectId) {
    const notesContent = document.getElementById('notesContent');
    notesContent.innerHTML = '<div class="note-item"><p>Loading notes...</p></div>';
    
    const notes = await loadNotes(projectId);
    
    notesContent.innerHTML = '';
    
    if (notes.length === 0) {
        notesContent.innerHTML = '<div class="note-item"><p>No notes available for this project</p></div>';
        return;
    }
    
    notes.forEach(note => {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        noteItem.innerHTML = `
            <p>${escapeHtml(note.note_text)}</p>
            <div class="note-date">${formatDisplayDate(note.created_at)}</div>
        `;
        notesContent.appendChild(noteItem);
    });
}

/**
 * Add note to selected project
 */
async function addNote() {
    const noteTextarea = document.getElementById('noteTextarea');
    const noteText = noteTextarea.value.trim();
    
    if (noteText && selectedProjectId) {
        showLoading();
        
        try {
            const { error } = await supabaseClient
                .from('project_notes')
                .insert([{
                    project_id: selectedProjectId,
                    note_text: noteText
                }]);

            if (error) throw error;

            await displayNotes(selectedProjectId);
            noteTextarea.value = '';
            
        } catch (error) {
            console.error('Error adding note:', error);
            alert('Error adding note: ' + error.message);
        } finally {
            hideLoading();
        }
    } else if (!selectedProjectId) {
        alert('Please select a project first');
    }
}

// ===== DATE FORMATTING UTILITIES =====

/**
 * Format date for display
 */
function formatDisplayDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error formatting date:', error, dateString);
        return 'Invalid Date';
    }
}

/**
 * Format updates date for display
 */
function formatUpdatesDisplayDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error formatting updates date:', error, dateString);
        return 'Invalid Date';
    }
}

/**
 * Format time for display
 */
function formatDisplayTime(timeString) {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Filter projects based on search term
 */
function filterProjects(searchTerm) {
    const term = searchTerm.toLowerCase();
    const rows = document.querySelectorAll('.projects-table-container tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(term)) {
            row.style.display = 'table-row';
        } else {
            row.style.display = 'none';
        }
    });
    
    updateStatusCounts();
}

/**
 * Update status counts in status boxes
 */
function updateStatusCounts() {
    const rows = document.querySelectorAll('.projects-table-container tbody tr');
    let allCount = 0;
    let pendingCount = 0;
    let waitingCount = 0;
    let completedCount = 0;
    
    rows.forEach(row => {
        if (row.style.display !== 'none' && row.offsetParent !== null) {
            allCount++;
            const statusElement = row.querySelector('.status');
            if (statusElement) {
                const status = statusElement.textContent.trim().toLowerCase();
                if (status === 'completed') {
                    completedCount++;
                } else if (status === 'in process') {
                    pendingCount++;
                } else if (status === 'pending') {
                    waitingCount++;
                }
            }
        }
    });
    
    document.querySelector('.all-projects .count').textContent = allCount;
    document.querySelector('.pending .count').textContent = pendingCount;
    document.querySelector('.waiting .count').textContent = waitingCount;
    document.querySelector('.completed .count').textContent = completedCount;
}

/**
 * Initialize projects table scroll functionality
 */
function initializeProjectsTableScroll() {
    const tableContainer = document.getElementById('projectsTableContainer');
    const showMoreIndicator = document.getElementById('showMoreIndicator');
    const rows = tableContainer.querySelectorAll('tbody tr');
    
    if (rows.length > 5) {
        tableContainer.classList.add('has-more-rows');
        showMoreIndicator.style.display = 'block';
        
        tableContainer.addEventListener('scroll', function() {
            const scrollTop = tableContainer.scrollTop;
            const scrollHeight = tableContainer.scrollHeight;
            const clientHeight = tableContainer.clientHeight;
            
            if (scrollTop + clientHeight >= scrollHeight - 10) {
                showMoreIndicator.style.display = 'none';
            } else {
                showMoreIndicator.style.display = 'block';
            }
        });
        
        showMoreIndicator.addEventListener('click', function() {
            tableContainer.scrollBy({ top: 100, behavior: 'smooth' });
        });
    } else {
        showMoreIndicator.style.display = 'none';
    }
}

/**
 * Initialize portfolio images scroll functionality
 */
function initializePortfolioImagesScroll() {
    const container = document.getElementById('portfolioImagesContainer');
    const showMoreIndicator = document.getElementById('portfolioImagesMore');
    
    if (!container || !showMoreIndicator) return;
    
    const images = container.querySelectorAll('.portfolio-image-item');
    
    if (images.length > 3) {
        showMoreIndicator.style.display = 'block';
        
        container.addEventListener('scroll', function() {
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            
            if (scrollTop + clientHeight >= scrollHeight - 10) {
                showMoreIndicator.style.display = 'none';
            } else {
                showMoreIndicator.style.display = 'block';
            }
        });
        
        showMoreIndicator.addEventListener('click', function() {
            container.scrollBy({ top: 100, behavior: 'smooth' });
        });
    } else {
        showMoreIndicator.style.display = 'none';
    }
}

/**
 * Get status text from status code
 */
function getStatusText(status) {
    const statusMap = {
        'completed': 'Completed',
        'in-process': 'In Process',
        'waiting': 'Pending',
        'planned': 'To Start'
    };
    return statusMap[status] || status;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ===== SKILLS FUNCTIONALITY =====

/**
 * Initialize skills functionality
 */
async function initializeSkills() {
    await loadSkills();
    setupSkillsEventListeners();
}

/**
 * Load skills from Supabase
 */
async function loadSkills() {
    try {
        const { data, error } = await supabaseClient
            .from('skills')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        skills = data || [];
        renderSkills();
    } catch (error) {
        console.error('Error loading skills:', error);
    }
}

/**
 * Render skills to the container
 */
function renderSkills() {
    const container = document.getElementById('skillsListContainer');
    if (!container) return;
    
    container.innerHTML = '';

    if (skills.length === 0) {
        container.innerHTML = `
            <div class="no-skills">
                <i class="fas fa-code"></i>
                <p>No skills added yet. Click "Add Skill" to get started.</p>
            </div>
        `;
        return;
    }

    skills.forEach((skill) => {
        const skillElement = createSkillElement(skill);
        container.appendChild(skillElement);
    });

    initializeSkillsScroll();
}

/**
 * Create HTML element for skill
 */
function createSkillElement(skill) {
    const div = document.createElement('div');
    div.className = 'skill-grid-item';
    div.setAttribute('data-skill-id', skill.id);
    
    div.innerHTML = `
        <div class="skill-grid-name">${escapeHtml(skill.name)}</div>
        <div class="skill-grid-actions">
            <button class="btn btn-edit btn-sm" data-skill-id="${skill.id}">Edit</button>
            <button class="btn btn-remove btn-sm" data-skill-id="${skill.id}">Remove</button>
        </div>
    `;
    
    return div;
}

/**
 * Setup skills event listeners
 */
function setupSkillsEventListeners() {
    const addSkillBtn = document.getElementById('add-skill-btn');
    if (addSkillBtn) {
        addSkillBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openSkillModal();
        });
    }
    
    const overlay = document.getElementById('skillOverlay');
    const cancelBtn = document.getElementById('skill-cancel-btn');
    const form = document.getElementById('skill-form');
    
    if (overlay) {
        overlay.addEventListener('click', closeSkillModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeSkillModal);
    }
    
    if (form) {
        form.addEventListener('submit', handleSkillSubmit);
    }
    
    const container = document.getElementById('skillsListContainer');
    if (container) {
        container.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-edit')) {
                e.stopPropagation();
                editSkill(e.target.getAttribute('data-skill-id'));
            } else if (e.target.classList.contains('btn-remove')) {
                e.stopPropagation();
                removeSkill(e.target.getAttribute('data-skill-id'));
            }
        });
    }
}

/**
 * Open skill modal
 */
function openSkillModal(skillId = null) {
    const modal = document.getElementById('skill-modal');
    const form = document.getElementById('skill-form');
    const title = document.getElementById('skillTitle');
    
    if (!modal) return;
    
    if (skillId) {
        editSkillId = skillId;
        const skill = skills.find(s => s.id == skillId);
        title.textContent = 'Edit Skill';
        document.getElementById('skill-name').value = skill.name || '';
    } else {
        editSkillId = null;
        title.textContent = 'Add Skill';
        if (form) form.reset();
    }
    
    modal.classList.remove('hidden');
}

/**
 * Close skill modal
 */
function closeSkillModal() {
    const modal = document.getElementById('skill-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editSkillId = null;
}

/**
 * Handle skill form submission
 */
async function handleSkillSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('skill-name').value.trim();
    
    if (!name) {
        alert('Please enter a skill name');
        return;
    }
    
    showLoading();
    
    try {
        if (editSkillId) {
            const { error } = await supabaseClient
                .from('skills')
                .update({
                    name: name,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editSkillId);

            if (error) throw error;
        } else {
            const { error } = await supabaseClient
                .from('skills')
                .insert([{
                    name: name
                }]);

            if (error) throw error;
        }
        
        await loadSkills();
        closeSkillModal();
        
    } catch (error) {
        console.error('Error saving skill:', error);
        alert('Error saving skill: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Edit skill
 */
function editSkill(skillId) {
    openSkillModal(skillId);
}

/**
 * Remove skill
 */
async function removeSkill(skillId) {
    if (!confirm('Are you sure you want to remove this skill?')) {
        return;
    }
    
    showLoading();
    
    try {
        const { error } = await supabaseClient
            .from('skills')
            .delete()
            .eq('id', skillId);

        if (error) throw error;

        await loadSkills();
        
    } catch (error) {
        console.error('Error removing skill:', error);
        alert('Error removing skill: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Initialize skills scroll functionality
 */
function initializeSkillsScroll() {
    const container = document.getElementById('skillsListContainer');
    const showMoreIndicator = document.getElementById('skillsMoreIndicator');
    
    if (!container || !showMoreIndicator) return;
    
    const skillItems = container.querySelectorAll('.skill-grid-item');
    
    if (skillItems.length > 6) {
        showMoreIndicator.style.display = 'block';
        
        container.addEventListener('scroll', function() {
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            
            if (scrollTop + clientHeight >= scrollHeight - 10) {
                showMoreIndicator.style.display = 'none';
            } else {
                showMoreIndicator.style.display = 'block';
            }
        });
        
        showMoreIndicator.addEventListener('click', function() {
            container.scrollBy({ top: 100, behavior: 'smooth' });
        });
    } else {
        showMoreIndicator.style.display = 'none';
    }
}

// ===== UPDATES FUNCTIONALITY =====

/**
 * Initialize updates functionality
 */
async function initializeUpdates() {
    await loadUpdates();
    setupUpdatesEventListeners();
}

/**
 * Load updates from Supabase
 */
async function loadUpdates() {
    try {
        const { data, error } = await supabaseClient
            .from('updates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading updates from Supabase:', error);
            updates = getSampleUpdates();
            renderUpdates();
            return;
        }

        updates = data || [];
        renderUpdates();
    } catch (error) {
        console.error('Error loading updates:', error);
        updates = getSampleUpdates();
        renderUpdates();
    }
}

/**
 * Get sample updates for fallback
 */
function getSampleUpdates() {
    return [
        {
            id: '1',
            title: "Project Design Updated",
            date: new Date().toISOString().split('T')[0],
            time: "14:30",
            icon: "fas fa-edit",
            type: "update"
        },
        {
            id: '2',
            title: "Client Feedback Received",
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            time: "11:45",
            icon: "fas fa-check-circle",
            type: "feedback"
        },
        {
            id: '3',
            title: "Final Delivery Sent",
            date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
            time: "16:20",
            icon: "fas fa-upload",
            type: "delivery"
        }
    ];
}

/**
 * Render updates to the container
 */
function renderUpdates() {
    const container = document.getElementById('updatesContainer');
    if (!container) return;
    
    container.innerHTML = '';

    if (updates.length === 0) {
        container.innerHTML = `
            <div class="no-updates">
                <i class="fas fa-bell-slash"></i>
                <p>No recent updates available. Click "Add Update" to get started.</p>
            </div>
        `;
        return;
    }

    updates.forEach((update) => {
        const updateElement = createUpdateElement(update);
        container.appendChild(updateElement);
    });

    setupUpdatesScroll();
}

/**
 * Create HTML element for update
 */
function createUpdateElement(update) {
    const div = document.createElement('div');
    div.className = 'update-item';
    div.setAttribute('data-update-id', update.id);
    
    const displayDate = formatUpdatesDisplayDate(update.date);
    const displayTime = formatDisplayTime(update.time);
    
    div.innerHTML = `
        <div class="update-icon">
            <i class="${update.icon}"></i>
        </div>
        <div class="update-content">
            <h4 class="update-title">${escapeHtml(update.title)}</h4>
            <div class="update-details">
                <span class="update-date">${displayDate}</span>
                <span class="update-time">${displayTime}</span>
            </div>
        </div>
        <div class="update-actions">
            <button class="update-action-btn update-edit-btn" data-update-id="${update.id}">
                <i class="fas fa-edit"></i>
            </button>
            <button class="update-action-btn update-delete-btn" data-update-id="${update.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return div;
}

/**
 * Setup updates event listeners
 */
function setupUpdatesEventListeners() {
    const addUpdateBtn = document.getElementById('add-update-btn');
    if (addUpdateBtn) {
        addUpdateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openUpdateModal();
        });
    }
    
    const overlay = document.getElementById('updateOverlay');
    const cancelBtn = document.getElementById('update-cancel-btn');
    const form = document.getElementById('update-form');
    
    if (overlay) {
        overlay.addEventListener('click', closeUpdateModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeUpdateModal);
    }
    
    if (form) {
        form.addEventListener('submit', handleUpdateSubmit);
    }
    
    const container = document.getElementById('updatesContainer');
    if (container) {
        container.addEventListener('click', function(e) {
            const updateId = e.target.closest('.update-action-btn')?.getAttribute('data-update-id');
            if (!updateId) return;
            
            if (e.target.closest('.update-edit-btn')) {
                e.stopPropagation();
                editUpdate(updateId);
            } else if (e.target.closest('.update-delete-btn')) {
                e.stopPropagation();
                removeUpdate(updateId);
            }
        });
    }
}

/**
 * Open update modal
 */
function openUpdateModal(updateId = null) {
    const modal = document.getElementById('update-modal');
    const form = document.getElementById('update-form');
    const title = document.getElementById('updateTitle');
    
    if (!modal) {
        console.error('Update modal not found!');
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);
    
    if (updateId) {
        console.log('Opening edit modal for update ID:', updateId);
        editUpdateId = updateId;
        const update = updates.find(u => u.id == updateId);
        
        if (!update) {
            console.error('Update not found with ID:', updateId);
            return;
        }
        
        title.textContent = 'Edit Update';
        document.getElementById('update-title').value = update.title || '';
        document.getElementById('update-date').value = update.date || today;
        document.getElementById('update-time').value = update.time || now;
        document.getElementById('update-icon').value = update.icon || 'fas fa-edit';
        document.getElementById('update-type').value = update.type || 'update';
    } else {
        console.log('Opening add modal for new update');
        editUpdateId = null;
        title.textContent = 'Add Update';
        if (form) form.reset();
        document.getElementById('update-date').value = today;
        document.getElementById('update-time').value = now;
    }
    
    modal.classList.remove('hidden');
}

/**
 * Close update modal
 */
function closeUpdateModal() {
    const modal = document.getElementById('update-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editUpdateId = null;
}

/**
 * Handle update form submission
 */
async function handleUpdateSubmit(e) {
    e.preventDefault();
    console.log('Handling update form submission...');
    
    const title = document.getElementById('update-title').value.trim();
    const date = document.getElementById('update-date').value;
    const time = document.getElementById('update-time').value;
    const icon = document.getElementById('update-icon').value;
    const type = document.getElementById('update-type').value;
    
    if (!title || !date || !time) {
        alert('Please fill all required fields');
        return;
    }
    
    showLoading();
    
    try {
        if (editUpdateId) {
            console.log('Updating existing update with ID:', editUpdateId);
            
            const updateData = {
                title: title,
                date: date,
                time: time,
                icon: icon,
                type: type
            };
            
            console.log('Update data:', updateData);
            
            const { data, error } = await supabaseClient
                .from('updates')
                .update(updateData)
                .eq('id', editUpdateId)
                .select();

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }
            
            console.log('Update successful, returned data:', data);
            
        } else {
            console.log('Adding new update');
            
            const newUpdate = {
                title: title,
                date: date,
                time: time,
                icon: icon,
                type: type
            };
            
            console.log('New update data:', newUpdate);
            
            const { data, error } = await supabaseClient
                .from('updates')
                .insert([newUpdate])
                .select();

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }
            
            console.log('Insert successful, returned data:', data);
        }
        
        await loadUpdates();
        closeUpdateModal();
        
    } catch (error) {
        console.error('Error saving update:', error);
        
        if (error.message && error.message.includes('does not exist')) {
            console.log('Updates table or column does not exist');
            alert('Database configuration issue. Please check your Supabase setup.');
        } else {
            alert('Error saving update: ' + error.message);
        }
    } finally {
        hideLoading();
    }
}

/**
 * Edit update
 */
function editUpdate(updateId) {
    console.log('Edit update called with ID:', updateId);
    openUpdateModal(updateId);
}

/**
 * Remove update
 */
async function removeUpdate(updateId) {
    if (!confirm('Are you sure you want to delete this update?')) {
        return;
    }
    
    showLoading();
    
    try {
        console.log('Deleting update with ID:', updateId);
        
        const { error } = await supabaseClient
            .from('updates')
            .delete()
            .eq('id', updateId);

        if (error) {
            console.error('Supabase delete error:', error);
            throw error;
        }

        await loadUpdates();
        
    } catch (error) {
        console.error('Error deleting update:', error);
        
        if (error.message && error.message.includes('does not exist')) {
            console.log('Updates table does not exist, using local fallback');
            updates = updates.filter(update => update.id !== updateId);
            renderUpdates();
        } else {
            alert('Error deleting update: ' + error.message);
        }
    } finally {
        hideLoading();
    }
}

/**
 * Setup updates scroll functionality
 */
function setupUpdatesScroll() {
    const container = document.getElementById('updatesContainer');
    const showMoreIndicator = document.getElementById('updatesMoreIndicator');
    
    if (!container || !showMoreIndicator) return;
    
    const updateItems = container.querySelectorAll('.update-item');
    
    if (updateItems.length > 3) {
        showMoreIndicator.style.display = 'block';
        
        container.addEventListener('scroll', function() {
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            
            if (scrollTop + clientHeight >= scrollHeight - 10) {
                showMoreIndicator.style.display = 'none';
            } else {
                showMoreIndicator.style.display = 'block';
            }
        });
        
        showMoreIndicator.addEventListener('click', function() {
            container.scrollBy({ top: 100, behavior: 'smooth' });
        });
    } else {
        showMoreIndicator.style.display = 'none';
    }
}

// ===== TO-DO LIST FUNCTIONALITY =====

/**
 * Initialize To-Do List
 */
async function initializeTodoList() {
    await loadTodos();
    setupTodoEventListeners();
}

/**
 * Load To-Dos from Supabase
 */
async function loadTodos() {
    try {
        const { data, error } = await supabaseClient
            .from('todos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading todos from Supabase:', error);
            loadTodosFromLocalStorage();
            return;
        }

        todos = data || [];
        renderTodos();
    } catch (error) {
        console.error('Error loading todos:', error);
        loadTodosFromLocalStorage();
    }
}

/**
 * Load To-Dos from Local Storage (Fallback)
 */
function loadTodosFromLocalStorage() {
    try {
        const savedTodos = localStorage.getItem('crm_todos');
        if (savedTodos) {
            todos = JSON.parse(savedTodos);
        }
        renderTodos();
    } catch (error) {
        console.error('Error loading todos from local storage:', error);
        todos = [];
    }
}

/**
 * Save To-Dos to Supabase
 */
async function saveTodos() {
    try {
        if (todos.length > 0) {
            console.log('Saving todos to Supabase...');
        }
        
        localStorage.setItem('crm_todos', JSON.stringify(todos));
    } catch (error) {
        console.error('Error saving todos:', error);
        localStorage.setItem('crm_todos', JSON.stringify(todos));
    }
}

/**
 * Setup To-Do Event Listeners
 */
function setupTodoEventListeners() {
    const addTodoBtn = document.getElementById('add-todo-btn');
    if (addTodoBtn) {
        addTodoBtn.addEventListener('click', showTodoInput);
    }

    const saveTodoBtn = document.getElementById('save-todo-btn');
    if (saveTodoBtn) {
        saveTodoBtn.addEventListener('click', addTodo);
    }

    const cancelTodoBtn = document.getElementById('cancel-todo-btn');
    if (cancelTodoBtn) {
        cancelTodoBtn.addEventListener('click', hideTodoInput);
    }

    const todoInput = document.getElementById('todoInput');
    if (todoInput) {
        todoInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTodo();
            }
        });
    }

    const todoListContainer = document.getElementById('todoListContainer');
    if (todoListContainer) {
        todoListContainer.addEventListener('click', handleTodoActions);
    }
}

/**
 * Show To-Do Input
 */
function showTodoInput() {
    const inputContainer = document.getElementById('todoInputContainer');
    const todoInput = document.getElementById('todoInput');
    
    if (inputContainer && todoInput) {
        inputContainer.style.display = 'block';
        todoInput.focus();
        todoInput.value = '';
        editTodoId = null;
    }
}

/**
 * Hide To-Do Input
 */
function hideTodoInput() {
    const inputContainer = document.getElementById('todoInputContainer');
    const todoInput = document.getElementById('todoInput');
    
    if (inputContainer && todoInput) {
        inputContainer.style.display = 'none';
        todoInput.value = '';
        editTodoId = null;
    }
}

/**
 * Add New To-Do
 */
async function addTodo() {
    const todoInput = document.getElementById('todoInput');
    const text = todoInput?.value.trim();

    if (!text) {
        alert('Please enter a task description');
        return;
    }

    try {
        if (editTodoId) {
            const todoIndex = todos.findIndex(todo => todo.id === editTodoId);
            if (todoIndex !== -1) {
                todos[todoIndex].text = text;
                todos[todoIndex].updated_at = new Date().toISOString();
                
                try {
                    const { error } = await supabaseClient
                        .from('todos')
                        .update({
                            text: text,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', editTodoId);

                    if (error) throw error;
                } catch (supabaseError) {
                    console.log('Failed to update todo in Supabase, using local storage:', supabaseError);
                }
            }
        } else {
            const newTodo = {
                id: generateTodoId(),
                text: text,
                completed: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            try {
                const { data, error } = await supabaseClient
                    .from('todos')
                    .insert([{
                        text: text,
                        completed: false
                    }])
                    .select();

                if (error) throw error;
                
                if (data && data[0]) {
                    newTodo.id = data[0].id;
                }
            } catch (supabaseError) {
                console.log('Failed to save todo to Supabase, using local storage:', supabaseError);
            }
            
            todos.unshift(newTodo);
        }

        await saveTodos();
        renderTodos();
        hideTodoInput();
        
    } catch (error) {
        console.error('Error saving todo:', error);
        alert('Error saving task: ' + error.message);
    }
}

/**
 * Generate Unique To-Do ID
 */
function generateTodoId() {
    return 'local_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

/**
 * Render To-Dos
 */
function renderTodos() {
    const container = document.getElementById('todoListContainer');
    const noTodosMessage = document.getElementById('noTodosMessage');
    
    if (!container) return;

    if (todos.length === 0) {
        container.innerHTML = `
            <div class="no-todos" id="noTodosMessage">
                <i class="fas fa-clipboard-list"></i>
                <p>No tasks yet. Add your first task to get started!</p>
            </div>
        `;
        updateTodoStats();
        return;
    }

    if (noTodosMessage) {
        noTodosMessage.style.display = 'none';
    }

    container.innerHTML = '';
    
    todos.forEach(todo => {
        const todoElement = createTodoElement(todo);
        container.appendChild(todoElement);
    });
    
    updateTodoStats();
}

/**
 * Create To-Do Element
 */
function createTodoElement(todo) {
    const div = document.createElement('div');
    div.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    div.setAttribute('data-todo-id', todo.id);

    div.innerHTML = `
        <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" data-action="toggle"></div>
        <div class="todo-text">${escapeHtml(todo.text)}</div>
        <div class="todo-actions">
            <button class="todo-action-btn todo-edit-btn" data-action="edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="todo-action-btn todo-delete-btn" data-action="delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return div;
}

/**
 * Handle To-Do Actions
 */
function handleTodoActions(e) {
    const todoItem = e.target.closest('.todo-item');
    if (!todoItem) return;

    const todoId = todoItem.getAttribute('data-todo-id');
    const action = e.target.closest('[data-action]')?.getAttribute('data-action');

    if (!action || !todoId) return;

    switch (action) {
        case 'toggle':
            toggleTodoCompletion(todoId);
            break;
        case 'edit':
            editTodo(todoId);
            break;
        case 'delete':
            deleteTodo(todoId);
            break;
    }
}

/**
 * Toggle To-Do Completion
 */
async function toggleTodoCompletion(todoId) {
    const todoIndex = todos.findIndex(todo => todo.id === todoId);
    if (todoIndex !== -1) {
        todos[todoIndex].completed = !todos[todoIndex].completed;
        todos[todoIndex].updated_at = new Date().toISOString();
        
        try {
            const { error } = await supabaseClient
                .from('todos')
                .update({
                    completed: todos[todoIndex].completed,
                    updated_at: new Date().toISOString()
                })
                .eq('id', todoId);

            if (error) throw error;
        } catch (supabaseError) {
            console.log('Failed to update todo completion in Supabase, using local storage:', supabaseError);
        }
        
        await saveTodos();
        renderTodos();
    }
}

/**
 * Edit To-Do
 */
function editTodo(todoId) {
    const todo = todos.find(todo => todo.id === todoId);
    if (!todo) return;

    const inputContainer = document.getElementById('todoInputContainer');
    const todoInput = document.getElementById('todoInput');
    
    if (inputContainer && todoInput) {
        inputContainer.style.display = 'block';
        todoInput.value = todo.text;
        todoInput.focus();
        editTodoId = todoId;
    }
}

/**
 * Delete To-Do
 */
async function deleteTodo(todoId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('todos')
            .delete()
            .eq('id', todoId);

        if (error) throw error;
    } catch (supabaseError) {
        console.log('Failed to delete todo from Supabase, using local storage:', supabaseError);
    }

    todos = todos.filter(todo => todo.id !== todoId);
    await saveTodos();
    renderTodos();
}

/**
 * Get Todo Statistics
 */
function getTodoStats() {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const pending = total - completed;

    return {
        total,
        completed,
        pending
    };
}

/**
 * Update To-Do Statistics
 */
function updateTodoStats() {
    const stats = getTodoStats();
    const statsContainer = document.getElementById('todoStats');
    const totalTasks = document.getElementById('totalTasks');
    const completedTasks = document.getElementById('completedTasks');
    const pendingTasks = document.getElementById('pendingTasks');
    
    if (statsContainer && totalTasks && completedTasks && pendingTasks) {
        if (stats.total > 0) {
            statsContainer.style.display = 'flex';
            totalTasks.textContent = stats.total;
            completedTasks.textContent = stats.completed;
            pendingTasks.textContent = stats.pending;
        } else {
            statsContainer.style.display = 'none';
        }
    }
}

// ===== PORTFOLIO ANALYTICS FUNCTIONS =====

/**
 * Load portfolio analytics data
 */
async function loadPortfolioAnalytics() {
    try {
        const { data, error } = await supabaseClient
            .from('portfolio_visits')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return [];
        return data || [];
    } catch (error) {
        return [];
    }
}

/**
 * Update portfolio statistics
 */
function updatePortfolioStats(visits) {
    const totalVisits = visits.length;
    const uniqueVisitors = new Set(visits.map(v => v.ip_address)).size;
    const today = new Date().toDateString();
    const todayVisits = visits.filter(v => new Date(v.created_at).toDateString() === today).length;
    const liveVisits = visits.filter(v => !v.environment || v.environment === 'live').length;

    const statCards = document.querySelectorAll('.portfolio-stats .stat-card');
    if (statCards.length >= 4) {
        statCards[0].querySelector('.stat-number').textContent = totalVisits.toLocaleString();
        statCards[0].querySelector('.stat-label').textContent = 'Total Views';
        
        statCards[1].querySelector('.stat-number').textContent = uniqueVisitors.toLocaleString();
        statCards[1].querySelector('.stat-label').textContent = 'Unique Visitors';
        
        statCards[2].querySelector('.stat-number').textContent = todayVisits.toLocaleString();
        statCards[2].querySelector('.stat-label').textContent = "Today's Views";
        
        statCards[3].querySelector('.stat-number').textContent = liveVisits.toLocaleString();
        statCards[3].querySelector('.stat-label').textContent = 'Live Visits';
    }
}

/**
 * Initialize portfolio analytics
 */
async function initializePortfolioAnalytics() {
    const visits = await loadPortfolioAnalytics();
    updatePortfolioStats(visits);
}

// =============================================
// END OF CRM DASHBOARD JAVASCRIPT
// =============================================