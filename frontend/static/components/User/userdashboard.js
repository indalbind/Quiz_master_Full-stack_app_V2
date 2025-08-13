export default {
  template: `
    <div class="content-wrapper">
      <h2 class="text-2xl fw-bold mb-4">Upcoming Quizzes</h2>
      <h4 class="mb-3 text-success">Welcome, {{ userName }}!</h4>

      <!-- Unified Quiz Table -->
        <div v-if="!showDetails && !showQuestions" class="card p-3" style="width: 1300px; background-color: rgb(232, 248, 243); border-radius: 0.8rem;">
          
          <!-- Header Row (Only Once) -->
          <div class="list-group-item d-flex fw-bold justify-content-between mb-1"
              style="background-color: rgb(232, 248, 243); border-radius: 0.4rem;">
            <span style="width: 15%; text-align:center;">ID</span>
            <span style="width: 15%; text-align:center;">Questions</span>
            <span style="width: 20%; text-align:center;">Date</span>
            <span style="width: 15%; text-align:center;">Duration</span>
            <span style="width: 35%; text-align:center;">Actions</span>
          </div>

          <!-- Quiz Data Rows -->
          <div
            v-for="quiz in quizzes"
            :key="quiz.id"
            class="list-group-item d-flex justify-content-between align-items-center mb-1"
            style="background-color: rgb(232, 248, 243); border-radius: 0.2rem;"
          >
            <span style="width: 15%; text-align:center;">{{ quiz.id }}</span>
            <span style="width: 15%; text-align:center;">{{ quiz.num_of_ques }}</span>
            <span style="width: 20%; text-align:center;">{{ quiz.date_of_quiz }}</span>
            <span style="width: 15%; text-align:center;">{{ quiz.time_duration }} min</span>
            <span style="width: 35%; text-align:center;">
              <button class="btn btn-primary btn-sm me-2" @click="viewQuiz(quiz)">View</button>
              <button class="btn btn-success btn-sm" @click="startQuiz(quiz.id)">Start</button>
            </span>
          </div>
        </div>

      <!-- Quiz Details View -->
      <div v-if="showDetails && selectedQuiz" class="card p-4 mt-4" style="background-color: rgb(232, 248, 243); border-radius: 0.8rem;">
        <h5 class="fw-bold mb-3">Quiz Details</h5>
        <p><strong>Quiz:</strong> {{ selectedQuiz.name }}</p>
        <p><strong>Date:</strong> {{ selectedQuiz.date_of_quiz }}</p>
        <p><strong>Duration:</strong> {{ selectedQuiz.time_duration }} minutes</p>
        <p><strong>No. of Questions:</strong> {{ selectedQuiz.num_of_ques }}</p>
        <p><strong>Chapter:</strong> {{ selectedQuiz.chapter.name }}</p>
        <p><strong>Subject:</strong> {{ selectedQuiz.chapter.subject.name }}</p>
        <p><strong>Status:</strong> {{ selectedQuiz.status }}</p>
        <button class="btn btn-secondary mt-3" @click="showDetails = false">Back</button>
      </div>

      <!-- Quiz Questions View -->
      <div v-if="showQuestions && quizQuestions" class="card p-4 mt-4" style="background-color: rgb(232, 248, 243); border-radius: 0.8rem;">
        <h5 class="fw-bold mb-3">{{ quizQuestions.quiz.name }} - Questions</h5>
        <div v-for="q in quizQuestions.questions" :key="q.id" class="mb-3">
          <p><strong>Q:</strong> {{ q.question }}</p>
          <div v-if="q.question_type === 'mcq'">
            <p>A. {{ q.option1 }}</p>
            <p>B. {{ q.option2 }}</p>
            <p>C. {{ q.option3 }}</p>
            <p>D. {{ q.option4 }}</p>
          </div>
          <div v-else>
            <p><em>Answer Type: {{ q.question_type }}</em></p>
          </div>
        </div>
        <button class="btn btn-secondary mt-3" @click="showQuestions = false">Back</button>
      </div>
  </div>
  `,
  data() {
    return {
      quizzes: [],
      selectedQuiz: null,
      quizQuestions: null,
      showDetails: false,
      showQuestions: false,
      userName: '' // for know who is login 
    };
  },
  methods: {
      async recordVisit() {
      try {
        const token = localStorage.getItem('token');
        await axios.post('/api/user/visit', null, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        // Optional: console.log("Visit recorded");
      } catch (err) {
        console.error("Failed to record visit", err);
        // Don't block the page if this fails
      }
    },
    async fetchQuizzes() {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/user/quizzes', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        this.quizzes = res.data.quizzes;
      } catch (err) {
        if (err.response && err.response.status === 403) {
          // User is blocked
          this.$router.replace({ name: 'blocked' });
        } else {
          console.error("Error fetching quizzes", err);
          alert("Unauthorized. Please login again.");
          localStorage.removeItem('token');
          this.$router.replace({ name: 'login' });
        }
  }
    },
    viewQuiz(quiz){
        const subjectId = quiz.chapter.subject.id;
        const chapterId = quiz.chapter.id;
        const quizId = quiz.id;
      this.$router.push({name:'viewquiz',params:{quizId, subjectId,chapterId,quizId}})
    },
    startQuiz(quizId) {
      this.$router.push({ name: 'startquiz', params: {quizId} });
    },

    async logineduserinfo() {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get('/api/user/profile', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          this.userName = res.data.full_name; 
        } catch (err) {
          console.error("Failed to fetch user info", err);
          // Optional fallback handling
        }
      }
  },
  mounted() {
    this.fetchQuizzes();
    this.recordVisit();
    this.logineduserinfo();
  }
};
