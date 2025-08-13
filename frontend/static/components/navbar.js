export default {
    props: ['usertype'],
    computed: {
        isAdmin() {
            return this.usertype === 'admin';
        },
        isUser() {
            return this.usertype === 'user';
        },
        isGuest() {
            return !this.usertype;
        },
        profilechange() {
            if (this.isAdmin) return '/admin/home';
            if (this.isUser) return '/user/home';
            return '/';
        }
    },
    methods: {
        logout() {
            localStorage.removeItem('token');
            this.$router.push('/login');
            this.$emit('role-change', null);
        }
    },
    template: `
        <nav class="navbar navbar-expand-lg navbar-light fixed-top">
            <router-link :to="profilechange" class="navbar-brand"> Quizex </router-link>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">

                    <!-- Admin Links ☣️ -->

                    <template v-if="isAdmin">
                    
                        <li class="nav-item">
                            <router-link to="/admin/summary" class="nav-link">Summary</router-link>
                        </li>
                        <li class="nav-item">
                            <router-link to="/admin/user" class="nav-link">User</router-link>
                        </li>
                    </template>

                    <!-- User Links 👨‍💼 -->

                    <template v-if="isUser">
                        <li class="nav-item">
                            <router-link to="/user/score" class="nav-link">Score</router-link>
                        </li>
                        <li class="nav-item">
                            <router-link to="/user/summary" class="nav-link">Summary</router-link>
                        </li>
                    </template>
                </ul>

                <!-- of home page when user not login 🦊-->
                <ul class="navbar-nav ms-auto">
                <template v-if = "isGuest">
                    <li class="nav-item">
                        <div class="auth-buttons">
                        <router-link to="/login" >Log in</router-link>
                        <router-link to="/signup" class="signup">Sign up</router-link>
                        </div>
                    </li>
                </template>
                <template v-else >
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a href="#" @click.prevent="logout" class="btn btn-outline-danger text-center">
                         <i class="fa fa-sign-out"></i> 
                           Logut
                        </a>
                    </li>
                </ul>
                </template>
                
                </ul>

            </div>
        </nav>
    `
};
