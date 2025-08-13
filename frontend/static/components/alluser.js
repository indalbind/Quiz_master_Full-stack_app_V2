export default {
    template:`
    <div class="content-wrapper">
      <h2 class="text-2xl font-bold mb-4"> Users</h2>
      <div v-if="loading">Loading...</div>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <div class="d-flex flex-wrap gap-3">
        <div v-for="user in users" :key="user.id" class="card p-3"  style="width: 600px; background-color: rgb(232, 248, 243); border-radius: 0.8rem;">
          <h5 class="fw-bold mb-2">Username: {{ user.username }}</h5>
          <p>User ID: {{ user.id }}</p>
          <p>Status: <span :class="user.blocked ? 'text-danger' : 'text-success'">
            {{ user.blocked ? 'Blocked' : 'Active' }}</span></p>

          <div class="d-flex gap-2 mt-2">
            <button class="btn btn-sm" 
                    :class="user.blocked ? 'btn-success' : 'btn-warning'"
                    @click="toggleBlockUser(user.id)">
              {{ user.blocked ? 'Unblock' : 'Block' }}
            </button>
            <button class="btn btn-sm btn-danger" @click="deleteUser(user.id)">
              Delete
            </button>
          </div>
        </div>
      </div>
      <div class = "dashboard"> </div>
    </div>
  `,
  data() {
    return {
      users: [],
      loading: false,
      error: null,
      token: localStorage.getItem('token'),
    };
  },
  methods: {
    fetchUsers() {
      this.loading = true;
      axios
        .get('/api/allusers', {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })
        .then((response) => {
          this.users = response.data.users || [];
          this.loading = false;
        })
        .catch(() => {
          this.error = 'Failed to load users';
          this.loading = false;
        });
    },
    deleteUser(id) {
      if (!confirm('Are you sure you want to delete this user?')) return;
      axios
        .delete(`/api/deleteuser/${id}`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })
        .then(() => {
          this.fetchUsers();
        });
    },
    toggleBlockUser(id) {
      axios
        .put(`/api/blockUnblockUser/${id}`, null, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })
        .then(() => {
          this.fetchUsers();
        });
    },
  },
  mounted() {
    this.fetchUsers();
  }
};