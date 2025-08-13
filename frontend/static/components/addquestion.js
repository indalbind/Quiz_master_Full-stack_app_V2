export default {
    template: `
      <div class="container mt-5 addquestionbody">

        <form @submit.prevent="submitQuestion" enctype="multipart/form-data" class="mt-5 addquestion">
            <h2 class="text-center mb-4">Add question</h2>

          <div class="mb-3">
            <label class="form-label">Question Statement</label>
            <textarea v-model="form.question_statement" class="form-control" style="width: 600px; height: 100px;" required></textarea>
          </div> 
  
          <div class="mb-3 d-flex align-items-center question-type-row">
            <label class="form-label me-3 mb-0"  style="min-width: 131px; ">Question Type</label>

            <select v-model="form.question_type" class="form-select flex-grow-1" style="max-width: 300px;">
              <option value="mcq">MCQ</option>
              <option value="numerical">Numerical</option>
              <option value="text">Text</option>
            </select>
          </div>
  
          <div v-if="form.question_type === 'mcq'" class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Option 1</label>
              <input v-model="form.option1" class="form-control" required />
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Option 2</label>
              <input v-model="form.option2" class="form-control" required />
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Option 3</label>
              <input v-model="form.option3" class="form-control" />
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Option 4</label>
              <input v-model="form.option4" class="form-control" />
            </div>
          </div>
  
          <div class="mb-3">
            <label class="form-label">Correct Answer</label>
            <input v-model="form.correct_answer" class="form-control" required />
          </div>
  
          <div class="mb-3">
            <label class="form-label">Mark</label>
            <input type="number" v-model="form.mark" class="form-control" min="1" required />
          </div>
  
          <div class="mb-3">
            <label class="form-label">Question Image (optional)</label>
            <input type="file" @change="handleImageUpload" class="form-control" accept="image/*" />
          </div>

          <div class="login-actions mb-4">
            <button type="submit" class="btn btn-success">Submit</button>
            <button type="button" class="btn btn-secondary ms-2" @click="$router.back()">Cancel</button>
          </div>

          </form>
          <div class="addquestionimage"></div>
      </div>
    `,
    data() {
      return {
        jwtToken: localStorage.getItem("token"),
        quizId: this.$route.params.quizId,
        form: {
          question_statement: '',
          question_type: 'mcq',
          option1: '',
          option2: '',
          option3: '',
          option4: '',
          correct_answer: '',
          image_path: '',
          mark: 1,
        },
        selectedImageFile: null,
      };
    },
    methods: {
      handleImageUpload(event) {
        this.selectedImageFile = event.target.files[0];
      },
      async submitQuestion() {
        try {
          let imagePath = "";
  
          // 1. Upload image if provided
          if (this.selectedImageFile) {
            const imageForm = new FormData();
            imageForm.append("image", this.selectedImageFile);
  
            const uploadRes = await axios.post("/api/upload_image", imageForm, {
              headers: {
                Authorization: `Bearer ${this.jwtToken}`,
                "Content-Type": "multipart/form-data",
              },
            });
  
            imagePath = uploadRes.data.image_path;
          }
  
          // 2. Prepare and send question data
          const questionData = {
            ...this.form,
            quiz_id: this.quizId,
            image_path: imagePath,
          };
  
          const res = await axios.post("/api/question", questionData, {
            headers: {
              Authorization: `Bearer ${this.jwtToken}`,
            },
          });
  
          alert("Question added successfully!");
          this.$router.back();
        } catch (err) {
          console.error("Error adding question:", err.response?.data || err);
          alert("Failed to add question");
        }
      },
    },
  };
  