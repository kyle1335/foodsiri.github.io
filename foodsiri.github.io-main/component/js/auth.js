// auth.js
window.handleRegister = function() {
    const name = document.getElementById('register-name-input').value.trim();
    const email = document.getElementById('register-email-input').value;
    const password = document.getElementById('register-password-input').value;
    const errorDiv = document.getElementById('register-error');
    errorDiv.textContent = '';

    if (!name || !email || !password) {
        errorDiv.textContent = '所有欄位都必須填寫！';
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;
            return user.updateProfile({
                displayName: name
            }).then(() => {
                return db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    displayName: name,
                    email: user.email
                });
            });
        })
        .then(() => {
            window.goBack();
        })
        .catch(error => {
            switch (error.code) {
                case 'auth/email-already-in-use': errorDiv.textContent = '此電子郵件已被註冊。'; break;
                case 'auth/invalid-email': errorDiv.textContent = '電子郵件格式不正確。'; break;
                case 'auth/weak-password': errorDiv.textContent = '密碼強度不足 (至少6位數)。'; break;
                default: errorDiv.textContent = '註冊失敗，請稍後再試。';
            }
        });
}

window.handleSignIn = function() {
    const email = document.getElementById('login-email-input').value;
    const password = document.getElementById('login-password-input').value;
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = '';

    if (!email || !password) {
        errorDiv.textContent = '請輸入電子郵件和密碼。';
        return;
    }

    auth.signInWithEmailAndPassword(email, password).then(() => {
        window.goBack();
    }).catch(() => {
        errorDiv.textContent = '登入失敗，請檢查信箱或密碼。';
    });
}



window.handleSignOut = function() {
    auth.signOut().catch(error => console.error("登出錯誤:", error));
}
