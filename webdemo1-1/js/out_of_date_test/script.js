function toggleAuthForm(targetForm) {
    const signInForm = document.getElementById('signInTab');
    const signUpForm = document.getElementById('signUpTab');

    if (targetForm === 'signUp') {
        signInForm.classList.remove('active');
        signUpForm.classList.add('active');
    } else {
        signUpForm.classList.remove('active');
        signInForm.classList.add('active');
    }
}
