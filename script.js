document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('multiStepForm');
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const progressSteps = Array.from(document.querySelectorAll('.progress-bar .step'));
    let currentStep = 0;

    // Form data object
    let formData = {
        name: '',
        email: '',
        age: '',
        dob: '',
        gender: '',
        phone: '',
        street: '',
        apartment: '',
        city: '',
        state: '',
        zipcode: '',
        country: ''
    };

    // Load saved data from localStorage if it exists
    const savedData = localStorage.getItem('formData');
    if (savedData) {
        formData = JSON.parse(savedData);
        populateFormFields();
    }

    // Validation patterns
    const patterns = {
        name: /^[a-zA-Z\s]{2,50}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^\+?[\d\s-]{10,}$/,
        age: /^(?:1[0-1][0-9]|[1-9][0-9]|[1-9])$/,
        zipcode: /^[0-9]{5,6}$/
    };

    // Error messages
    const errorMessages = {
        name: 'Please enter a valid name (2-50 characters, letters only)',
        email: 'Please enter a valid email address',
        age: 'Please enter a valid age between 1 and 120',
        dob: 'Please enter a valid date of birth',
        gender: 'Please select your gender',
        phone: 'Please enter a valid phone number (minimum 10 digits)',
        street: 'Please enter your street address',
        city: 'Please enter your city',
        state: 'Please enter your state/province',
        zipcode: 'Please enter a valid ZIP/postal code',
        country: 'Please enter your country'
    };

    // Add event listeners for navigation buttons
    document.querySelectorAll('.btn.next').forEach(button => {
        button.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                saveStepData(currentStep);
                nextStep();
            }
        });
    });

    document.querySelectorAll('.btn.prev').forEach(button => {
        button.addEventListener('click', prevStep);
    });

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateStep(currentStep)) {
            saveStepData(currentStep);
            // Here you would typically send the data to a server
            console.log('Form submitted:', formData);
            localStorage.removeItem('formData'); // Clear stored data after successful submission
            alert('Form submitted successfully!');
            form.reset();
            goToStep(0);
        }
    });

    // Input event listeners for real-time validation
    form.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', () => {
            validateField(input);
            saveToLocalStorage();
        });
    });

    function validateField(field) {
        const formGroup = field.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        let isValid = true;

        if (field.required && !field.value.trim()) {
            showError(field, `${field.name} is required`);
            isValid = false;
        } else if (patterns[field.name] && !patterns[field.name].test(field.value)) {
            showError(field, errorMessages[field.name]);
            isValid = false;
        } else {
            clearError(field);
        }

        return isValid;
    }

    function validateStep(step) {
        const currentStepElement = steps[step];
        const fields = currentStepElement.querySelectorAll('input, select, textarea');
        let isValid = true;

        fields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    function showError(field, message) {
        const formGroup = field.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        formGroup.classList.add('error');
        formGroup.classList.remove('success');
        errorElement.textContent = message;
    }

    function clearError(field) {
        const formGroup = field.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        formGroup.classList.remove('error');
        formGroup.classList.add('success');
        errorElement.textContent = '';
    }

    function saveStepData(step) {
        const currentStepElement = steps[step];
        const fields = currentStepElement.querySelectorAll('input, select, textarea');

        fields.forEach(field => {
            formData[field.name] = field.value;
        });

        saveToLocalStorage();
        if (step === 2) {
            updateSummary();
        }
    }

    function saveToLocalStorage() {
        localStorage.setItem('formData', JSON.stringify(formData));
    }

    function populateFormFields() {
        for (const [key, value] of Object.entries(formData)) {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = value;
            }
        }
        updateSummary();
    }

    function updateSummary() {
        const summaryDiv = document.getElementById('summary');
        
        // Update all field values in the summary
        const fields = [
            'name', 'email', 'age', 'dob', 'gender',  // Basic Details
            'phone', 'street', 'apartment', 'city', 'state', 'zipcode', 'country'  // Contact Information
        ];

        fields.forEach(field => {
            const element = summaryDiv.querySelector(`[data-field="${field}"]`);
            if (element) {
                if (field === 'dob' && formData[field]) {
                    const date = new Date(formData[field]);
                    element.textContent = date.toLocaleDateString();
                } else {
                    element.textContent = formData[field] || '';
                }
            }
        });

        // Add event listeners for edit buttons if not already added
        if (!summaryDiv.hasAttribute('data-listeners-added')) {
            summaryDiv.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const stepToEdit = parseInt(button.getAttribute('data-step'));
                    goToStep(stepToEdit);
                });
            });
            summaryDiv.setAttribute('data-listeners-added', 'true');
        }

        // Handle confirmation checkbox
        const confirmCheckbox = document.getElementById('confirmInfo');
        const submitButton = document.querySelector('.btn.submit');

        // Remove existing event listeners before adding new one
        const newCheckbox = confirmCheckbox.cloneNode(true);
        confirmCheckbox.parentNode.replaceChild(newCheckbox, confirmCheckbox);
        
        newCheckbox.addEventListener('change', () => {
            submitButton.disabled = !newCheckbox.checked;
        });

        // Validate if all required fields are filled
        const requiredFields = [
            'name', 'email', 'age', 'dob', 'gender', 'phone',
            'street', 'city', 'state', 'zipcode', 'country'
        ];
        const allFieldsFilled = requiredFields.every(field => formData[field] && formData[field].toString().trim() !== '');
        
        if (!allFieldsFilled) {
            newCheckbox.checked = false;
            submitButton.disabled = true;
            
            const existingMessage = document.querySelector('.missing-fields-message');
            if (!existingMessage) {
                const message = document.createElement('div');
                message.className = 'error-message missing-fields-message';
                message.textContent = 'Please fill in all required fields before submitting';
                document.querySelector('.confirmation-box').appendChild(message);
            }
        } else {
            const existingMessage = document.querySelector('.missing-fields-message');
            if (existingMessage) {
                existingMessage.remove();
            }
        }
    }

    function nextStep() {
        if (currentStep < steps.length - 1) {
            goToStep(currentStep + 1);
        }
    }

    function prevStep() {
        if (currentStep > 0) {
            goToStep(currentStep - 1);
        }
    }

    function goToStep(step) {
        steps[currentStep].classList.remove('active');
        progressSteps[currentStep].classList.remove('active');
        if (step < currentStep) {
            for (let i = currentStep; i > step; i--) {
                progressSteps[i].classList.remove('completed');
            }
        } else {
            for (let i = currentStep; i < step; i++) {
                progressSteps[i].classList.add('completed');
            }
        }
        
        currentStep = step;
        steps[currentStep].classList.add('active');
        progressSteps[currentStep].classList.add('active');
    }
}); 