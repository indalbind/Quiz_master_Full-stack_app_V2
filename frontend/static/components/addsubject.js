export default {
    template: `
      <div class="add-subject">
        <div class="form-container mt-5">
          <form @submit.prevent="addSubject" class="chapter_form">
            <h2 class="text-center mb-4">Add Subject</h2>
  
            <div class="mb-4">
              <input v-model="formSubject.name" type="text" class="form-control input" placeholder="Subject name" required />
            </div>
  
            <div class="mb-4">
              <input v-model="formSubject.description" type="text" class="form-control input" placeholder="Subject description" required />
            </div>
  
            <div class="login-actions mb-5">
              <button type="submit" class="btn btn-success">Save</button>
              <button type="button" class="btn btn-secondary ml-2" @click="cancel">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `,
    data() {
      return {
        jwtToken: localStorage.getItem("token"),
        formSubject: {
          name: "",
          description: ""
        }
      };
    },
    methods: {
      addSubject() {
        axios.post("/api/subject", this.formSubject, {
          headers: { Authorization: `Bearer ${this.jwtToken}` }
        })
        .then(() => {
          alert("Subject added successfully!");
          this.$router.push({ name: 'admindashboard' });
        })
        .catch((error) => {
          console.error("Error adding chapter:", error);
          alert("Failed to add chapter.");
        });
      },
      cancel() {
        this.$router.push({ name: 'admindashboard' });
      }
    }
  }
  