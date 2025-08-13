export default {
    template: `
    <div class="content-wrapper">
      <h2 class="text-2xl font-bold mb-4">Manage Quizzes</h2>
  
      <div v-if="quizzes.length === 0" class="text-muted mb-4">No quizzes found for this chapter.</div>
  
      <!-- Quiz Cards -->
      <div class="d-flex flex-wrap gap-3">
        <div v-for="(quiz, quizIndex) in quizzes" :key="quiz.id" class="card p-3" style="width: 600px; background-color: rgb(232, 248, 243); border-radius: 0.8rem;">
          <span style="fw-bold; cursor: pointer; color:rgb(65, 91, 134); margin-top:2px; width:90px" @click="showQuizDetails(quiz)">
               <h5> {{ quiz.name }} </h5>
              </span>  

          <!-- Question Headers -->
            <div class="mb-2">
                <div class="list-group-item d-flex fw-bold justify-content-between" style="background-color:rgb(232, 248, 243); border-radius: 0.4rem;">
                    <span style="width: 40%;">Question id</span>
                    <span style="width: 50%; ">Question type</span>
                    <span style="width: 30%;text-align:center;">Actions</span>
                </div>
          
  
                <!-- Questions row -->
                <div v-for="(question, questionidx) in quiz.questions" :key="question.id"
                    class="list-group-item d-flex justify-content-between align-items-center"
                    style="background-color:rgb(232, 248, 243) ; border-radius: 0.4rem; text-align:center">

                    <span style="width: 10%;">{{ questionidx + 1 }}</span>
                    <span style="width: 50%; text-align:center" v-html="question.question_type"></span>
                    <span style="width: 30%; text-align: center;">
                    <button class="btn btn-sm btn-outline-primary me-1" @click="$router.push({ name: 'EditQuestion', params: {id: question.id } })">Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="deleteQuestion(question.id, quizIndex, questionIndex)">Delete</button>
                    </span>
                </div>
            </div>
  
        <!-- Add Question Button -->
           
          <button class="btn btn-success btn-sm mt-3" @click="addQuestion(quiz.id)">+ Question</button>
    
          <hr/>
          <div class="d-flex"> 
            <button class="btn btn-sm btn-outline-danger" @click="deleteQuiz(quiz.id)">Delete Quiz</button>
            <button class="btn btn-sm btn-outline-primary" @click="editquiz(quiz.id)" style = "margin-left:350px">Edit  Quiz</button>
          </div>
        </div>
      </div>
  
      <!-- Add Quiz Button -->
        <div> 
          <button class="btn btn-primary mt-4" @click="addNewQuiz">+ New Quiz</button>
        </div> 
      <div class="quizimage"></div>
    </div>
    `,
    data() {
      return {
        chapterId: this.$route.params.chapterId,
        quizzes: [],
        jwtToken: localStorage.getItem("token"),
      };
    },
    mounted() {
      this.fetchQuizzes();
    },
    methods: {

      deleteQuestion(questionId, quizIndex, questionIndex) {
        if (!confirm("Are you sure you want to delete this question?")) return;
        
        axios
          .delete(`/api/question/${questionId}`, {
            headers: { Authorization: `Bearer ${this.jwtToken}` },
          })
          .then(() => {
            // Remove the question from the correct quiz's questions array
            this.quizzes[quizIndex].questions.splice(questionIndex, 1);
            alert("Question deleted successfully");
          })
          .catch((err) => {
            console.error("Error deleting question:", err.response?.data?.msg || err.message);
            alert("Failed to delete the question.");
          });
      },

        showQuizDetails(quiz) {
            alert(
              `Subject: ${quiz.subject_name || 'N/A'}\nChapter: ${quiz.chapter_name || 'N/A'}`
            )
        },
      fetchQuizzes() {
        axios
          .get(`/api/quiz?chapter_id=${this.chapterId}`, {
            headers: { Authorization: `Bearer ${this.jwtToken}` },
          })
          .then((res) => {
            this.quizzes = res.data.quizzes.map(q => ({
              ...q,
              questions: []
            }));
  
            this.quizzes.forEach((quiz, i) => {
              axios
                .get(`/api/question?quiz_id=${quiz.id}`, {
                  headers: { Authorization: `Bearer ${this.jwtToken}` },
                })
                .then((res) => {
                  this.quizzes[i].questions = res.data.questions;
                });
            });
          })
          .catch((err) => {
            console.error("Failed to load quizzes:", err.response?.data?.msg || err.message);
          });
      },

      addQuestion(quizId) {
        this.$router.push({ name: 'AddQuestion', params: { quizId } });
      },

      addNewQuiz() {
        this.$router.push({ name: 'AddQuiz', params: { chapterId: this.chapterId } });
      },

      deleteQuiz(quizId) {
        if (!confirm("Are you sure you want to delete this quiz?")) return;
  
        axios.delete(`/api/quiz/${quizId}`, {
            headers: { Authorization: `Bearer ${this.jwtToken}` },
          })
          .then(() => {
            this.quizzes = this.quizzes.filter(q => q.id !== quizId);
          })
          .catch((err) => {
            alert("Error deleting quiz");
            console.error(err);
          });
      },
      editquiz(quizId){
      this.$router.push({ name: 'Update_quiz', params: { id: quizId, chapterId: this.chapterId } });
      }
    }
  };
  