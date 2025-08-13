export default {
  template: `
    <div class="text-center p-5">
      <h2 class="text-2xl font-bold text-red-600 mb-4"> 🚫 Quiz Not Yet Available</h2>
      <p class="text-lg">This quiz is scheduled for a future.</p>
      <p> Quiz start at <strong>Date:</strong> <span style="margin-left:12px; background-color:rgb(233, 117, 55)"> {{ formattedDate }}</span> </p>
      <router-link to="/user/home" class="btn btn-primary mt-4">Go to Dashboard</router-link>
    </div>
  `,

  computed: {
    formattedDate() {
        const Date_of_quiz = this.$route.query.date;
        if (!Date_of_quiz){
          return '';  
        } 

        const date = new Date(Date_of_quiz);

        return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
        });
    }
    }

}
