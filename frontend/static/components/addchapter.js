export default {
    template: `
      <div class="add-chapter">
        <div class="form-container mt-5">
          <form @submit.prevent="addChapter" class="chapter_form">
            <h2 class="text-center mb-4">Add Chapter</h2>
  
            <div class="mb-4">
              <input v-model="formChapter.name" type="text" class="form-control input" placeholder="Chapter name" required />
            </div>
  
            <div class="mb-4">
              <input v-model="formChapter.description" type="text" class="form-control input" placeholder="Chapter description" required />
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
        formChapter: {
          name: "",
          description: "",
          subject_id: null
        }
      };
    },
    created() {
      const subjectId = this.$route.params.subjectId;
      if (!subjectId) {
        alert("No subject selected. Redirecting...");
        this.$router.push({ name: 'admindashboard' });
      } else {
        this.formChapter.subject_id = subjectId;
      }
    },
    methods: {
      addChapter() {
        axios.post("/api/chapter", this.formChapter, {
          headers: { Authorization: `Bearer ${this.jwtToken}` }
        })
        .then(() => {
          alert("Chapter added successfully!");
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
  