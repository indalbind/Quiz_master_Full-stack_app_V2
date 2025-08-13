import router from './router.js';
import navbar from "./components/navbar.js";

function userRole() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.is_admin ? 'admin' : 'user';
    } catch {
        return null;
    }
}

new Vue({
    el: '#app',
    router,
    data() {
        return {
            usertype: userRole()  // Will be updated by login component
        };
    },
    components: {
        navbar
    },
    template: `
        <div> 
            <navbar :usertype="usertype" @role-change="usertype = $event"></navbar>

            <div class="main-content">
                <router-view></router-view>
            </div>
            
        </div>
    `
});
