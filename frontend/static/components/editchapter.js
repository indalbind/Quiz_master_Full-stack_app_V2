export default {
    template: `
        <div class="edit-chapter">
            <div class="form-container mt-5">
                <form @submit.prevent="updateChapter" class = "chapter_form">
                    <h2 class="text-center mb-4">Edit The Chapter</h2>

                    <div class="mb-4">
                        
                        <input v-model="formChapter.name" type="text" class="form-control input" placeholder="Chapter name" required />
                    </div>

                    <div class="mb-4">
                       
                        <input v-model="formChapter.description" type="text" class="form-control input" placeholder="Chapter description" required />
                    </div>
                    
                    <div class="login-actions mb-5">
                        <button type="submit" class="btn btn-success ">Save</button>
                        <button type="button" class="btn btn-secondary ml-2" @click="resetChapterForm">Cancel</button>
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
        },
        editingChapter: null
      };
    },
    created() {
      this.fetchChapterDetails();
    },
    methods: {
      fetchChapterDetails() {
        const chapterId = this.$route.params.chapterId;
        axios.get(`/api/chapter/${chapterId}`, {
          headers: { Authorization: `Bearer ${this.jwtToken}` }
        })
        .then((res) => {
          // Try to access chapter data safely
          const chapter = res.data.chapter || res.data; // fallback if not nested
          if (!chapter || !chapter.name) {
            alert("Chapter not found or invalid response format.");
            return;
          }
  
          this.editingChapter = chapter;
          this.formChapter = {
            name: chapter.name,
            description: chapter.description,
            subject_id: chapter.subject_id
          };
        })
        .catch((error) => {
          console.error("Error fetching chapter details:", error);
          alert("Failed to fetch chapter details.");
        });
      },
  
      resetChapterForm() {
        this.formChapter = {
          name: "",
          description: "",
          subject_id: null
        };
        this.editingChapter = null;
        this.$router.push({ name: 'admindashboard' });
      },
  
      updateChapter() {
        if (!this.editingChapter) {
          alert("No chapter to update.");
          return;
        }
  
        const url = `/api/chapter/${this.editingChapter.id}`;
        axios.put(url, this.formChapter, {
          headers: { Authorization: `Bearer ${this.jwtToken}` }
        })
        .then(() => {
          alert("Chapter updated successfully!");
          this.resetChapterForm();
          this.$router.push({ name: 'admindashboard' }); // Redirect to dashboard
        })
        .catch((error) => {
          console.error("Error updating chapter:", error);
          alert("Failed to update chapter.");
        });
      }
    }
  };
  