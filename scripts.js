$(document).ready(function() {
    
    // ===== TIMER FUNCTIONALITY =====
    let timerInterval;
    let timerSeconds = 0;
    let isTimerRunning = false;
    
    // Initialize timer from existing time (2.5 hours = 9000 seconds for demo)
    timerSeconds = 9000;
    updateTimerDisplay();
    
    // Start Timer
    $('#start-timer').on('click', function() {
        if (!isTimerRunning) {
            isTimerRunning = true;
            $(this).prop('disabled', true);
            $('#pause-timer').prop('disabled', false);
            $('#stop-timer').prop('disabled', false);
            
            timerInterval = setInterval(function() {
                timerSeconds++;
                updateTimerDisplay();
            }, 1000);
            
            showNotification('Timer started', 'success');
        }
    });
    
    // Pause Timer
    $('#pause-timer').on('click', function() {
        if (isTimerRunning) {
            isTimerRunning = false;
            clearInterval(timerInterval);
            $('#start-timer').prop('disabled', false);
            $(this).prop('disabled', true);
            
            showNotification('Timer paused', 'info');
        }
    });
    
    // Stop Timer
    $('#stop-timer').on('click', function() {
        isTimerRunning = false;
        clearInterval(timerInterval);
        $('#start-timer').prop('disabled', false);
        $('#pause-timer').prop('disabled', true);
        $(this).prop('disabled', true);
        
        showNotification('Timer stopped', 'info');
    });
    
    // Update Timer Display
    function updateTimerDisplay() {
        const hours = Math.floor(timerSeconds / 3600);
        const minutes = Math.floor((timerSeconds % 3600) / 60);
        const seconds = timerSeconds % 60;
        
        const display = 
            String(hours).padStart(2, '0') + ':' +
            String(minutes).padStart(2, '0') + ':' +
            String(seconds).padStart(2, '0');
        
        $('#timer-display').text(display);
        
        // Update time spent in hours
        const hoursDecimal = (timerSeconds / 3600).toFixed(1);
        $('#time-display').text(hoursDecimal + ' hours');
    }
    
    
    // ===== WORK LOG FORM VALIDATION =====
    const formFields = [
        { id: 'work_description', minLength: 100 },
        { id: 'files_changed', minLength: 20 },
        { id: 'solution_approach', minLength: 50 },
        { id: 'testing_done', minLength: 50 },
        { id: 'testing_instructions', minLength: 50 }
    ];
    
    // Character counter for all text areas
    formFields.forEach(field => {
        $(`#${field.id}`).on('input', function() {
            const length = $(this).val().length;
            $(`#${field.id}_count`).text(length);
            
            // Visual feedback
            if (length >= field.minLength) {
                $(this).removeClass('is-invalid').addClass('is-valid');
                $(`#${field.id}_count`).css('color', 'var(--success-green)');
            } else {
                $(this).removeClass('is-valid');
                $(`#${field.id}_count`).css('color', 'var(--primary-blue)');
            }
        });
    });
    
    // Time spent validation
    $('#time_spent').on('input', function() {
        const value = parseFloat($(this).val());
        if (value > 0 && value <= 24) {
            $(this).removeClass('is-invalid').addClass('is-valid');
        } else {
            $(this).removeClass('is-valid');
        }
    });
    
    
    // ===== SUBMIT WORK LOG =====
    $('#submit-work-log').on('click', function(e) {
        e.preventDefault();
        
        // Validate all fields
        let isValid = true;
        const errors = [];
        
        formFields.forEach(field => {
            const value = $(`#${field.id}`).val().trim();
            if (value.length < field.minLength) {
                isValid = false;
                errors.push(`${field.id.replace(/_/g, ' ')} must be at least ${field.minLength} characters`);
                $(`#${field.id}`).addClass('is-invalid');
            }
        });
        
        // Validate time spent
        const timeSpent = parseFloat($('#time_spent').val());
        if (isNaN(timeSpent) || timeSpent <= 0 || timeSpent > 24) {
            isValid = false;
            errors.push('Time spent must be between 0.1 and 24 hours');
            $('#time_spent').addClass('is-invalid');
        }
        
        if (!isValid) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                html: '<ul style="text-align: left;">' + 
                      errors.map(err => `<li>${err}</li>`).join('') + 
                      '</ul>',
                confirmButtonColor: '#3B82F6'
            });
            return;
        }
        
        // Show loading state
        const $submitBtn = $(this);
        $submitBtn.prop('disabled', true).addClass('loading');
        
        // Prepare form data
        const formData = {
            csrf_token: $('input[name="csrf_token"]').val(),
            issue_id: $('input[name="issue_id"]').val(),
            work_description: $('#work_description').val().trim(),
            files_changed: $('#files_changed').val().trim(),
            solution_approach: $('#solution_approach').val().trim(),
            testing_done: $('#testing_done').val().trim(),
            testing_instructions: $('#testing_instructions').val().trim(),
            blockers_encountered: $('#blockers_encountered').val().trim(),
            time_spent: $('#time_spent').val()
        };
        
        // AJAX call to submit work log
        $.ajax({
            url: 'process-work-log.php',
            method: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                $submitBtn.prop('disabled', false).removeClass('loading');
                
                if (response.success) {
                    $('#workLogModal').modal('hide');
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Work Log Submitted!',
                        html: `
                            <p><strong>Points Earned:</strong> ${response.points} points</p>
                            <p>Your work log has been submitted and a retest request has been sent to the tester.</p>
                        `,
                        confirmButtonColor: '#10B981',
                        confirmButtonText: 'Great!'
                    }).then(() => {
                        // Redirect or reload
                        window.location.reload();
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Submission Failed',
                        text: response.message || 'An error occurred. Please try again.',
                        confirmButtonColor: '#EF4444'
                    });
                }
            },
            error: function(xhr, status, error) {
                $submitBtn.prop('disabled', false).removeClass('loading');
                
                Swal.fire({
                    icon: 'error',
                    title: 'Network Error',
                    text: 'Unable to submit work log. Please check your connection and try again.',
                    confirmButtonColor: '#EF4444'
                });
                
                console.error('AJAX Error:', error);
            }
        });
    });
    
    
    // ===== ABANDON ISSUE =====
    $('#abandon-issue-btn').on('click', function() {
        Swal.fire({
            title: 'Abandon Issue?',
            text: 'Are you sure you want to abandon this issue? It will return to the available pool.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#F59E0B',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, abandon it',
            cancelButtonText: 'Cancel',
            input: 'textarea',
            inputPlaceholder: 'Please provide a reason for abandoning this issue...',
            inputValidator: (value) => {
                if (!value || value.trim().length < 10) {
                    return 'Please provide a reason (at least 10 characters)';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const reason = result.value;
                
                // AJAX call to abandon issue
                $.ajax({
                    url: 'abandon-issue.php',
                    method: 'POST',
                    data: {
                        issue_id: 47,
                        reason: reason,
                        csrf_token: $('input[name="csrf_token"]').val()
                    },
                    dataType: 'json',
                    success: function(response) {
                        if (response.success) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Issue Abandoned',
                                text: 'The issue has been returned to the available pool.',
                                confirmButtonColor: '#10B981'
                            }).then(() => {
                                window.location.href = 'available-issues.php';
                            });
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: response.message || 'Unable to abandon issue.',
                                confirmButtonColor: '#EF4444'
                            });
                        }
                    },
                    error: function() {
                        Swal.fire({
                            icon: 'error',
                            title: 'Network Error',
                            text: 'Unable to process request. Please try again.',
                            confirmButtonColor: '#EF4444'
                        });
                    }
                });
            }
        });
    });
    
    
    // ===== ADD COMMENT =====
    $('#submit-comment').on('click', function() {
        const commentText = $('#comment-text').val().trim();
        
        if (commentText.length < 5) {
            Swal.fire({
                icon: 'warning',
                title: 'Comment Too Short',
                text: 'Please write a meaningful comment (at least 5 characters).',
                confirmButtonColor: '#F59E0B'
            });
            return;
        }
        
        const $btn = $(this);
        $btn.prop('disabled', true).addClass('loading');
        
        // AJAX call to add comment
        $.ajax({
            url: 'add-comment.php',
            method: 'POST',
            data: {
                issue_id: 47,
                comment_text: commentText,
                csrf_token: $('input[name="csrf_token"]').val()
            },
            dataType: 'json',
            success: function(response) {
                $btn.prop('disabled', false).removeClass('loading');
                
                if (response.success) {
                    // Add comment to the UI
                    const newComment = `
                        <div class="comment-item mb-3 pb-3 border-bottom">
                            <div class="d-flex">
                                <div class="flex-shrink-0">
                                    <div class="avatar-circle bg-primary">JD</div>
                                </div>
                                <div class="flex-grow-1 ms-3">
                                    <div class="d-flex justify-content-between">
                                        <h6 class="mb-1">${response.author_name}</h6>
                                        <small class="text-muted">Just now</small>
                                    </div>
                                    <p class="mb-0">${escapeHtml(commentText)}</p>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    $('.add-comment-form').before(newComment);
                    $('#comment-text').val('');
                    
                    showNotification('Comment added successfully', 'success');
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || 'Unable to add comment.',
                        confirmButtonColor: '#EF4444'
                    });
                }
            },
            error: function() {
                $btn.prop('disabled', false).removeClass('loading');
                
                Swal.fire({
                    icon: 'error',
                    title: 'Network Error',
                    text: 'Unable to add comment. Please try again.',
                    confirmButtonColor: '#EF4444'
                });
            }
        });
    });
    
    
    // ===== LIGHTBOX CONFIGURATION =====
    lightbox.option({
        'resizeDuration': 200,
        'wrapAround': true,
        'albumLabel': 'Image %1 of %2'
    });
    
    
    // ===== AUTO-SAVE DRAFT (Every 60 seconds) =====
    let autoSaveInterval;
    
    $('#workLogModal').on('shown.bs.modal', function() {
        // Load draft if exists
        loadDraft();
        
        // Start auto-save
        autoSaveInterval = setInterval(function() {
            saveDraft();
        }, 60000); // 60 seconds
    });
    
    $('#workLogModal').on('hidden.bs.modal', function() {
        // Stop auto-save when modal is closed
        clearInterval(autoSaveInterval);
    });
    
    function saveDraft() {
        const draft = {
            work_description: $('#work_description').val(),
            files_changed: $('#files_changed').val(),
            solution_approach: $('#solution_approach').val(),
            testing_done: $('#testing_done').val(),
            testing_instructions: $('#testing_instructions').val(),
            blockers_encountered: $('#blockers_encountered').val(),
            time_spent: $('#time_spent').val()
        };
        
        localStorage.setItem('work_log_draft_47', JSON.stringify(draft));
        console.log('Draft auto-saved');
    }
    
    function loadDraft() {
        const draft = localStorage.getItem('work_log_draft_47');
        if (draft) {
            const draftData = JSON.parse(draft);
            
            Swal.fire({
                title: 'Draft Found',
                text: 'Would you like to restore your previous draft?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3B82F6',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Restore Draft',
                cancelButtonText: 'Start Fresh'
            }).then((result) => {
                if (result.isConfirmed) {
                    $('#work_description').val(draftData.work_description).trigger('input');
                    $('#files_changed').val(draftData.files_changed).trigger('input');
                    $('#solution_approach').val(draftData.solution_approach).trigger('input');
                    $('#testing_done').val(draftData.testing_done).trigger('input');
                    $('#testing_instructions').val(draftData.testing_instructions).trigger('input');
                    $('#blockers_encountered').val(draftData.blockers_encountered);
                    $('#time_spent').val(draftData.time_spent);
                    
                    showNotification('Draft restored', 'success');
                }
            });
        }
    }
    
    
    // ===== HELPER FUNCTIONS =====
    
    function showNotification(message, type) {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
        
        Toast.fire({
            icon: type,
            title: message
        });
    }
    
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
    
    
    // ===== REAL-TIME UPDATES (Every 60 seconds) =====
    setInterval(function() {
        // Check for new comments, activity, or status changes
        $.ajax({
            url: 'get-issue-updates.php',
            method: 'GET',
            data: { issue_id: 47 },
            dataType: 'json',
            success: function(response) {
                if (response.has_updates) {
                    showNotification('New activity on this issue', 'info');
                    // Optionally reload specific sections
                }
            },
            error: function() {
                // Silently fail
                console.log('Failed to check for updates');
            }
        });
    }, 60000); // Every 60 seconds
    
    
    // ===== KEYBOARD SHORTCUTS =====
    $(document).on('keydown', function(e) {
        // Ctrl/Cmd + Enter to submit comment
        if ((e.ctrlKey || e.metaKey) && e.keyCode === 13) {
            if ($('#comment-text').is(':focus')) {
                $('#submit-comment').click();
            }
        }
        
        // Escape to close modals
        if (e.keyCode === 27) {
            if ($('#workLogModal').hasClass('show')) {
                $('#workLogModal').modal('hide');
            }
        }
    });
    
    
    // ===== RESPONSIVE TABLE (if needed elsewhere) =====
    function makeTablesResponsive() {
        $('table').each(function() {
            if (!$(this).parent().hasClass('table-responsive')) {
                $(this).wrap('<div class="table-responsive"></div>');
            }
        });
    }
    
    makeTablesResponsive();
    
    
    // ===== FORM RESET ON MODAL CLOSE =====
    $('#workLogModal').on('hidden.bs.modal', function() {
        // Ask if user wants to keep draft
        const hasContent = $('#work_description').val().trim().length > 0;
        
        if (hasContent) {
            // Draft is already saved by auto-save
            console.log('Draft saved on modal close');
        }
    });
    
});