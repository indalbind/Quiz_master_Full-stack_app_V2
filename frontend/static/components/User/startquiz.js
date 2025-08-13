export default {
  template: `
    <div class="p-4">
      <h2 class="text-xl font-bold mb-4" style = "display: inline">Start Quiz</h2>
      <div v-if="loading">Loading quiz...</div>

      <div v-else>

        <!-- Add timer display here -->
        <div class="mb-4 text-right text-red-600 font-bold " style="margin-left:1100px;display: inline;margin-top:50px">
          Time Remaining: {{ formattedTime }}
        </div>

        <div class="mb-6">
          <h3 class="text-lg font-semibold">{{ quiz.name }}</h3>
          <p><strong>Subject:</strong> {{ quiz.chapter.subject.name }}</p>
          <p><strong>Chapter:</strong> {{ quiz.chapter.name }}</p>
          <p style = "display:inline"><strong>Duration:</strong> {{ quiz.time_duration }} mins</p>
          <button @click="canclequiz" class="btn btn-danger bg-green-600 px-4 py-2 rounded hover:bg-blue-700" style="margin-left:1000px; display:inline"> 
              Cancle 
          </button>
          <hr>

        </div>

        <div v-for="(q, index) in questions" :key="q.id" class="mb-6 border-b pb-4">
          <p class="font-medium"><strong>Q{{ index + 1 }}:</strong> {{ q.question }}</p>

          <!-- Image (if any) -->
          <div v-if="q.image_path">
            <img :src="q.image_path" alt="Question image" style="max-width: 300px; height: auto; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);" />
          </div>

          <!-- MCQ type questions -->
          <div v-if="q.question_type === 'mcq'" class="ms-3 mt-2">
            <div class="form-check" v-if="q.option1">
              <input type="radio" :name="'question_' + q.id" class="form-check-input" :value="q.option1" v-model="userAnswers[q.id]">
              <label class="form-check-label">{{ q.option1 }}</label>
            </div>
            <div class="form-check" v-if="q.option2">
              <input type="radio" :name="'question_' + q.id" class="form-check-input" :value="q.option2" v-model="userAnswers[q.id]">
              <label class="form-check-label">{{ q.option2 }}</label>
            </div>
            <div class="form-check" v-if="q.option3">
              <input type="radio" :name="'question_' + q.id" class="form-check-input" :value="q.option3" v-model="userAnswers[q.id]">
              <label class="form-check-label">{{ q.option3 }}</label>
            </div>
            <div class="form-check" v-if="q.option4">
              <input type="radio" :name="'question_' + q.id" class="form-check-input" :value="q.option4" v-model="userAnswers[q.id]">
              <label class="form-check-label">{{ q.option4 }}</label>
            </div>
          </div>

          <!-- Numerical or text input type -->
          <div v-else-if="q.question_type === 'numerical' || q.question_type === 'text'" class="mt-2">
            <input
              type="text"
              v-model="userAnswers[q.id]"
              class="border px-2 py-1 rounded w-full"
              placeholder="Enter your answer"
            />
          </div>

          <!-- Fallback -->
          <div v-else class="mt-2 italic text-sm text-gray-500">
            Unsupported question type: {{ q.question_type }}
          </div>
        </div>

        <div>
          <button @click="submitQuiz " :disabled="submitting" class="btn btn-success bg-green-600 px-4 py-2 rounded hover:bg-blue-700">
            {{ submitting ? "Submitting..." : "Submit Quiz" }}
          </button>

          <button @click="canclequiz" class="btn btn-danger bg-green-600 px-4 py-2 rounded hover:bg-blue-700" style="margin-left:1000px"> 
            Cancle 
          </button>
        </div>

        <p v-if="scoreMsg" class="mt-4 font-semibold" style="color: green;">
          {{ scoreMsg }}
        </p>
      </div>
    </div>
  `,
  data() {
    return {
      quiz: null,
      questions: [],
      userAnswers: {},
      loading: true,
      submitting: false,
      scoreMsg: "",
      timeLeft: 0, // in seconds
      timer: null,
    };
  },
  computed: {
        formattedTime() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    },
    mounted() {
        this.fetchQuiz();
    },
    beforeUnmount() {
        // Clear timer when component is destroyed
        clearInterval(this.timer);
    },
  methods: {
    async fetchQuiz() {
      const quizId = this.$route.params.quizId;
      const token = localStorage.getItem("token");

      try {
        const res = await fetch(`/api/user/quiz/${quizId}/questions`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.status === 403) {
            const errorData = await res.json();
            const date = encodeURIComponent(errorData.date_of_quiz || '');
            this.$router.push({ name: 'QuizLocked', query: { date } });  //  redirect to locked page
            return;
        }

        if (!res.ok) {
          throw new Error("Failed to fetch quiz data.");
        }

        const data = await res.json();
        this.quiz = data.quiz;
        this.questions = data.questions;

        // Initialize timer after loading quiz data
        this.timeLeft = this.quiz.time_duration * 60; // Convert minutes to seconds
        this.startTimer();

        this.loading = false;
      } catch (err) {
        console.error("Failed to fetch quiz questions", err);
        this.loading = false;
      }
    },
    startTimer() {
      this.timer = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
        } else {
          clearInterval(this.timer);
          this.submitQuiz(); // Auto-submit when time runs out
        }
      }, 1000);
    },
    canclequiz(){
      this.$router.push({name:'userhome'})
      clearInterval(this.timer);
    },
    async submitQuiz() {
    clearInterval(this.timer); //clear the timer when submited 
      this.submitting = true;
      const quizId = this.$route.params.quizId;
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(`/api/user/quiz/${quizId}/submitquiz`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ answers: this.userAnswers })
        });

        // setTimeout(() => {
        //   this.$router.push({ name: 'userhome' });
        // }, 2000);

        const result = await response.json();
        this.scoreMsg = result.msg;
      } catch (err) {
        console.error("Error submitting quiz", err);
        this.scoreMsg = "Submission failed. Try again.";
      } finally {
        this.submitting = false;
      }
    }
  },
};
