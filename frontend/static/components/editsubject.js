export default {
    template: `
      <div class="edit-subject">
        <div class="form-container mt-5">
          <form @submit.prevent="updateSubject" class="chapter_form">
            <h2 class="text-center mb-4">Edit Subject</h2>
  
            <div class="mb-4">
              <input v-model="formSubject.name" type="text" class="form-control input" placeholder="Subject name" required />
            </div>
  
            <div class="mb-4">
              <input v-model="formSubject.description" type="text" class="form-control input" placeholder="Subject description" required />
            </div>
  
            <div class="login-actions mb-5">
              <button type="submit" class="btn btn-success">Update</button>
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
        },
        subjectId: null
      };
    },
    created() {
      this.subjectId = this.$route.params.subjectId;
      this.fetchSubjectDetails();
    },
    methods: {
      fetchSubjectDetails() {
        axios.get(`/api/subject/${this.subjectId}`, {
          headers: { Authorization: `Bearer ${this.jwtToken}` }
        })
        .then((res) => {
          const subject = res.data.subject || res.data;
          this.formSubject = {
            name: subject.name,
            description: subject.description
          };
        })
        .catch((error) => {
          console.error("Error fetching subject:", error);
          alert("Failed to fetch subject details.");
        });
      },
      updateSubject() {
        axios.put(`/api/subject/${this.subjectId}`, this.formSubject, {
          headers: { Authorization: `Bearer ${this.jwtToken}` }
        })
        .then(() => {
          alert("Subject updated successfully!");
          this.$router.push({ name: 'admindashboard' });
        })
        .catch((error) => {
          console.error("Error updating subject:", error);
          alert("Failed to update subject.");
        });
      },
      cancel() {
        this.$router.push({ name: 'admindashboard' });
      }
    }
  };
  