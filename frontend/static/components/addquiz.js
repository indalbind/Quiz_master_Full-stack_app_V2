export default {
    template: `
    <div class="quizbody">
      <!-- Floating popup message -->
      <div v-if="showPopup" class="popup-alert">
        {{ popupMessage }}
      </div>
  
      <!-- Form container -->
      <div class="form-container">
        <form @submit.prevent="submitQuiz" class="mt-5 addquiz">
          <h2 class="text-center mb-4">Add New Quiz</h2>
  
          <div class="mb-4">
            <input v-model="name" type="text" class="form-control line-input" placeholder="Quiz Name" required>
          </div>

          <div class="mb-3">
            <input v-model="date_of_quiz" type="text" placeholder="quiz date" class="form-control line-input" @focus="(e) => e.target.type = 'date' "  @blur="(e) => { if (!e.target.value) e.target.type = 'text' }" required>
            
            </div>
  
          <div class="mb-4">
            <input v-model="time_duration" type="text" class="form-control line-input" placeholder="Time Duration (e.g., 30 mins)" required>
          </div>
  
          <div class="mb-4">
            <input v-model="no_of_question" type="number" class="form-control line-input" placeholder="Number of Questions" required>
          </div>
  
          <div class="mb-4">
            <textarea v-model="remarks" class="form-control line-input" rows="3" placeholder="Remarks (optional)"></textarea>
          </div>
  
          <div class="login-actions mb-4">
            <button type="submit" class="btn btn-primary">Add Quiz</button>
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
    methods: {
      submitQuiz() {
        const quizData = {
          name: this.name,
          chapter_id: this.chapterId,
          date_of_quiz: this.date_of_quiz,
          time_duration: this.time_duration,
          remarks: this.remarks,
          no_of_question: this.no_of_question,
        };
  
        axios
          .post('/api/quiz', quizData, {
            headers: {
              Authorization: `Bearer ${this.jwtToken}`,
            },
          })
          .then(() => {
            this.popupMessage = 'Quiz added successfully!';
            this.showPopup = true;
            setTimeout(() => {
              this.$router.push({ name: 'ChapterQuiz', params: { chapterId: this.chapterId } });
            }, 1500);
          })
          .catch((error) => {
            const msg = error.response?.data?.msg || error.response?.data?.error || 'Failed to add quiz';
            this.popupMessage = msg;
            this.showPopup = true;
          });
      },
    },
  };
  