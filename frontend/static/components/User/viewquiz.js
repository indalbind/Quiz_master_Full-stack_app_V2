export default {
  template: `
    <div class="container mt-4">
      <div v-if="quizDetails" class="card p-4 shadow-sm rounded">
        <h4 class="mb-3">Quiz Details</h4>
        <!-- <button @click="startingquiz"> Start the quiz </button>  -->
        <p><strong>Name:</strong> {{ quizDetails.name }}</p>
        <p><strong>ID:</strong> {{ quizDetails.id }}</p>
        <p><strong>Date:</strong> {{ quizDetails.date_of_quiz }}</p>
        <p><strong>Duration:</strong> {{ quizDetails.time_duration }} minutes</p>
        <p><strong>No. of Questions:</strong> {{ quizDetails.num_of_ques }}</p>
        <!-- <p><strong>Total number of Questions:</strong> {{ quizDetails.total_queston }}</p> -->
        <p><strong>Chapter:</strong> {{ quizDetails.chapter.name }}</p>
        <p><strong>Subject:</strong> {{ quizDetails.chapter.subject.name }}</p>
        <p><strong>Status:</strong> {{ quizDetails.status }}</p>
        <button class="btn btn-secondary mt-3" @click="$router.go(-1)">Back</button>
      </div>
      <div v-else class="text-center mt-5">
        <p>Loading quiz details...</p>
      </div>
    </div>
  `,
  data() {
    return {
      quizDetails: null
    };
  },
  async mounted() {
    const token = localStorage.getItem('token');
    const { quizId, subjectId, chapterId } = this.$route.params; // so that we can acess in path 

    try {
      const res = await axios.get(`/api/user/subject/${subjectId}/chapter/${chapterId}/quiz/${quizId}/view`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      this.quizDetails = res.data.quiz_details;
    } catch (err) {
      console.error("Failed to load quiz details", err);
      alert("Could not load quiz information.");
    }
  },
  // methods:{
  //   startingquiz(){
  //   const { quizId } = this.$route.params;
  //   this.$router.push({ name: 'startquiz', params: { quizId } });
  // },
  // }
};
