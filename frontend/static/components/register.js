export default {
    template:` 
    <div class="register">
        <!-- Floating popup message -->
        <div v-if="showPopup" class="popup-alert">
        {{ error }}
        </div>

        <!-- Form container -->
        <div class="form-container">
        <form @submit.prevent="registerUser" class="mt-5 registerpage">
            <h2 class="text-center mb-4">Sign up</h2>

            <div class="mb-3">
            <input v-model="username" type="text" class="form-control line-input" placeholder="Enter your username" required>
            </div>

            <div class="mb-3">
            <input v-model="email" type="email" class="form-control line-input" placeholder="Enter your email" required>
            </div>

            <div class="mb-3">
            <input v-model="full_name" type="text" class="form-control line-input" placeholder="Enter your full name" required>
            </div>

            <div class="mb-3">
            <input v-model="qualification" type="text" class="form-control line-input" placeholder="Enter your qualification" required>
            </div>

            <div class="mb-3">
            <input v-model="dob" type="text" placeholder="Enter your DOB" class="form-control line-input" @focus="(e) => e.target.type = 'date' "  @blur="(e) => { if (!e.target.value) e.target.type = 'text' }" required>
            
            </div>

            <div class="mb-3">
            <input v-model="password" type="password" class="form-control line-input" placeholder="Enter your password" required>
            </div>

            <div class="mb-3">
            <input v-model="confirmPassword" type="password" class="form-control line-input" placeholder="Confirm your password" required>
            </div>

            <div class="login-actions mb-5">
            <button type="submit" class="btn btn-success">Register</button>
            <div style="color: rgb(27, 122, 79);">Start your journey now!</div>
            </div>

            <p class="position">
            Already have an account?
            <router-link to="/login" class="signup textspace">Login</router-link>
            </p>
        </form>
        </div>
        <div class="registerimage"></div>
        </div>
       `,
    data() {
        return {
            username: '',
            email: '',
            full_name: '',
            qualification: '',
            dob: '',
            password: '',
            confirmPassword: '',
            showPopup: false,
            error: ''
            };
    },
    methods: {
        async registerUser() {
            if (this.password !== this.confirmPassword) {
                this.error = "Passwords do not match!";
                this.showPopup = true;
                setTimeout(() => this.showPopup = false, 3000);
                return;
            }
    
            try {
                const response = await fetch('api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: this.username,
                        email: this.email,
                        full_name: this.full_name,
                        qualification: this.qualification,
                        dob: this.dob,
                        password: this.password
                    })
                });
    
                const data = await response.json();
    
                if (!response.ok) {
                    this.error = data.msg || "Registration failed.";
                    this.showPopup = true;
                    setTimeout(() => this.showPopup = false, 3000);
                    return;
                }
    
                this.$router.replace('/login');
    
            } catch (err) {
                this.error = 'Something went wrong. Try again.';
                this.showPopup = true;
                setTimeout(() => this.showPopup = false, 3000);
            }
        }
    }
}