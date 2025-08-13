export default {
  template: `
    <div class="quizbody">
      <div v-if="showPopup" class="popup-alert">{{ popupMessage }}</div>

      <div class="form-container">
        <form @submit.prevent="updateQuiz" class="mt-5 addquiz">
          <h2 class="text-center mb-4">Edit Quiz</h2>

          <div class="mb-4">
            <input v-model="name" type="text" class="form-control line-input" placeholder="Quiz Name" required>
          </div>

          <div class="mb-3">
            <input v-model="date_of_quiz" type="text" class="form-control line-input" placeholder="Quiz Date"
              @focus="e => e.target.type = 'date'"
              @blur="e => { if (!e.target.value) e.target.type = 'text' }" required>
          </div>

          <div class="mb-4">
            <input v-model="time_duration" type="text" class="form-control line-input" placeholder="Time Duration" required>
          </div>

          <div class="mb-4">
            <input v-model="no_of_question" type="number" class="form-control line-input" placeholder="Number of Questions" required>
          </div>

          <div class="mb-4">
            <textarea v-model="remarks" class="form-control line-input" rows="3" placeholder="Remarks (optional)"></textarea>
          </div>

          <div class="login-actions mb-4">
            <button type="submit" class="btn btn-primary">Update Quiz</button>
            <button type="button" class="btn btn-secondary ms-2" @click="$router.back()">Cancel</button>
          </div>

          <p class="position">
            Want to manage quizzes?
            <router-link :to="{ name: 'Quizinfo', params: { chapterId: chapterId } }" class="signup textspace">Back to Quizzes</router-link>
          </p>
        </form>
      </div>

      <div class="registerimage"></div>
    </div>
  `,
  data() {
    return {
      quizId: this.$route.params.id,
      chapterId: this.$route.params.chapterId,
      name: '',
      date_of_quiz: '',
      time_duration: '',
      no_of_question: '',
      remarks: '',
      popupMessage: '',
      showPopup: false,
      jwtToken: localStorage.getItem('token'),
    };
  },
  mounted() {
    this.loadQuizDetails();
  },
  methods: {
    loadQuizDetails() {
      axios
        .get(`/api/quiz?chapter_id=${this.chapterId}`, {
          headers: {
            Authorization: `Bearer ${this.jwtToken}`,
          },
        })
        .then((res) => {
          const quiz = res.data.quizzes.find(q => q.id == this.quizId);
          if (!quiz) throw new Error("Quiz not found");

          this.name = quiz.name;
          this.date_of_quiz = quiz.date_of_quiz;
          this.time_duration = quiz.time_duration;
          this.no_of_question = quiz.no_of_question;
          this.remarks = quiz.remarks;
          this.chapterId = this.$route.params.chapterId || quiz.chapter_id;
        })
        .catch((error) => {
          this.popupMessage = "Failed to load quiz details.";
          this.showPopup = true;
          console.error(error);
        });
    },

    updateQuiz() {
      const updatedData = {
        name: this.name,
        date_of_quiz: this.date_of_quiz,
        time_duration: this.time_duration,
        no_of_question: this.no_of_question,
        remarks: this.remarks,
      };

      axios
        .put(`/api/quiz/${this.quizId}`, updatedData, {
          headers: {
            Authorization: `Bearer ${this.jwtToken}`,
          },
        })
        .then(() => {
          this.popupMessage = "Quiz updated successfully!";
          this.showPopup = true;
          setTimeout(() => {
            this.$router.push({ name: 'Quizinfo', params: { chapterId: this.chapterId } });
          }, 1500);
        })
        .catch((error) => {
          this.popupMessage = error.response?.data?.msg || error.response?.data?.error || "Failed to update quiz";
          this.showPopup = true;
        });
    },
  },
};
