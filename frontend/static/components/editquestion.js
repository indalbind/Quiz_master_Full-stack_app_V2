export default {
  props: ['id'],
  template: `
    <div class="container mt-5">

      <form @submit.prevent="updateQuestion" enctype="multipart/form-data" class="mt-5 editquestion">
          <h2 class="mb-4">Edit Question</h2>

        <div class="mb-3">
          <label class="form-label">Question Statement</label>
          <textarea v-model="form.question_statement" class="form-control" style="width: 600px; height: 100px;" required></textarea>
        </div>

        <div class="mb-3  d-flex align-items-center question-type-row">
          <label class="form-label me-3 mb-0" style="min-width: 131px; " >Question Type</label>
          <select v-model="form.question_type" class="form-select">
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
          <label class="form-label">Update Image (optional)</label>
          <input type="file" @change="handleImageUpload" class="form-control" accept="image/*" />
          <div v-if="form.image_path" class="mt-2">
          <p> current image </p>
            <img :src="form.image_path" alt="Current" style="max-width: 200px;" />
          </div>
        </div>

        <div class="login-actions mb-4">
        <button type="submit" class="btn btn-primary">Update</button>
        <button type="button" class="btn btn-secondary ms-2" @click="$router.back()">Cancel</button>
        </div>

      </form>
      <div class="addquestionimage"></div>
    </div>
  `,
  data() {
    return {
      jwtToken: localStorage.getItem("token"),
      questionId: this.id,
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
  mounted() {
    this.fetchQuestion();
  },
  methods: {
    handleImageUpload(event) {
      this.selectedImageFile = event.target.files[0];
    },
    async fetchQuestion() {
      try {
        const res = await axios.get(`/api/question/${this.questionId}`, {
          headers: { Authorization: `Bearer ${this.jwtToken}` },
        });
        this.form = res.data;
      } catch (err) {
        console.error("Failed to fetch question:", err.response?.data || err);
        alert("Error loading question");
        this.$router.back();
      }
    },
    async updateQuestion() {
      try {
        let imagePath = this.form.image_path;

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

        const updatedData = {
          ...this.form,
          image_path: imagePath,
        };

        await axios.put(`/api/question/${this.questionId}`, updatedData, {
          headers: { Authorization: `Bearer ${this.jwtToken}` },
        });

        alert("Question updated successfully!");
        this.$router.back();
      } catch (err) {
        console.error("Error updating question:", err.response?.data || err);
        alert("Failed to update question");
      }
    },
  },
};
