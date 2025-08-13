export default {
  template: `
    <div class="content-wrapper">
      <h2 class="text-2xl fw-bold mb-4">Your Quiz Scores</h2>

      <div class="d-flex align-items-center border rounded px-2 mb-4" style="background-color: white; width: 500px;">
      <span> 🔍 </span>
      <input 
        v-model="searchQuery" 
        @input="filterScores" 
        type="text" 
        class="form-control border-0 shadow-none" 
        placeholder="Search by Subject, Chapter, Score, %, or Date..." 
      />
    </div>

      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 text-secondary">Loading your scores...</p>
      </div>

      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>

      <div v-else-if="scores.length === 0" class="alert alert-warning">
        No quiz scores found. Try taking some quizzes first!
      </div>

      <!-- Score Cards -->
      <div class="d-flex flex-wrap gap-3">
        <div
          class="card p-3"
          style="width: 1400px; background-color: rgb(232, 248, 243); border-radius: 0.8rem;margin-right:40px">

          <!-- Score Row Header -->
          <div class="list-group-item d-flex fw-bold justify-content-between mb-1"
            style="background-color: rgb(232, 248, 243); border-radius: 0.4rem;">

            <span style="width: 25%; text-align:center;">Id</span>
            <span style="width: 25%; text-align:center;">Quiz-name</span>
            <span style="width: 25%; text-align:center;">Subject</span>
            <span style="width: 25%; text-align:center;">Chapter</span>
            <span style="width: 25%;">Date</span>
            <span style="width: 25%; text-align:center;">Totalquestion</span>
            <span style="width: 25%; text-align:center;">Scored</span>
            <span style="width: 25%; text-align:center;">%</span>

          </div>

          <!-- Score Row Data -->
          <div
          v-for="(score, index) in filteredScores" 
          :key="score.quiz_id" 
          class="list-group-item d-flex justify-content-between align-items-center mb-3"
          style="background-color: rgb(232, 248, 243); border-radius: 0.2rem;"
          >

            <span style="width: 25%; text-align:center;">{{ score.quiz_id }}</span>
            <span style="width: 25%; text-align:center;">{{ score.quiz_name }}</span>
            <span style="width: 25%; text-align:center;">{{ score.subject_name }}</span>
            <span style="width: 25%; text-align:center;">{{ score.chapter_name }}</span>
            <span style="width: 25%;">{{ formatDate(score.attempt_date) }}</span>
            <span style="width: 25%; text-align:center;">{{ score.total_questions }}</span>
            <span style="width: 25%; text-align:center;"
              :class="{
                'text-success': score.percentage >= 70,
                'text-warning': score.percentage >= 50 && score.percentage < 70,
                'text-danger': score.percentage < 50
              }"
            >
              {{ score.total_scored }}/{{score.max_marks}}
            </span>
            <span style="width: 25%; text-align:center;">
              <span class="badge"
                :class="{
                  'bg-success': score.percentage >= 70,
                  'bg-warning text-dark': score.percentage >= 50 && score.percentage < 70,
                  'bg-danger': score.percentage < 50
                }"
              >
                {{ score.percentage.toFixed(1) }}%
              </span>
            </span>
          </div>

        </div>
      </div>
    </div>
  
  `,
  data() {
    return {
      scores: [],
      filteredScores: [],  // to hold filtered results
      searchQuery: '',
      loading: true,
      error: null
    }
  },
  mounted() {
    this.fetchScores()
  },
  methods: {
   async fetchScores() {
        const token = localStorage.getItem('token')
        try {
            const response = await fetch('/api/user/scores', {  // Ensure this matches backend
            headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.status === 403) {
                // User is blocked
                this.$router.replace({ name: 'blocked' });
                return; // Stop execution
            }
            
            // Check if response is HTML instead of JSON
            const contentType = response.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text()
            throw new Error(`Received HTML instead of JSON: ${text.slice(0, 100)}...`)
            }
            
            const data = await response.json()
            if (!response.ok) {
            throw new Error(data.msg || 'Failed to load scores')
            }
            
            this.scores = data.scores
            this.filteredScores = data.scores // <-- Initialize filteredScores here!
        } 
        catch (err) {
            console.error('Fetch error:', err)
            this.error = err.message || 'Failed to load scores'

        } finally {
            this.loading = false
        }
    } ,
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    calculateAverage() {
      if (this.scores.length === 0) return 0
      const total = this.scores.reduce((sum, score) => sum + score.percentage, 0)
      return total / this.scores.length
    },
    calculateHighest() {
      if (this.scores.length === 0) return 0
      return Math.max(...this.scores.map(score => score.percentage))
    },
    filterScores() {
  const query = this.searchQuery.trim().toLowerCase()

  if (!query) {
    this.filteredScores = this.scores
    return
  }

  const isPercentageSearch = query.endsWith('%')
  const numberQuery = parseFloat(query.replace('%', ''))

  this.filteredScores = this.scores.filter(score => {
    const subject = score.subject_name.toLowerCase()
    const chapter = score.chapter_name.toLowerCase()
    const scored = score.total_scored
    const maxMarks = score.max_marks
    const percentage = score.percentage
    const formattedDate = new Date(score.attempt_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).toLowerCase()

    // Match subject or chapter (text)
    const textMatch = subject.includes(query) || chapter.includes(query)

    // Match exact percentage (e.g., "100%" or "100")
    const percentageMatch = !isNaN(numberQuery) && (
      isPercentageSearch
        ? Math.round(percentage) === Math.round(numberQuery)
        : false
    )

    // Match scores (total scored, max marks) if not a % search
    const numericMatch = !isNaN(numberQuery) && !isPercentageSearch && (
      scored === numberQuery || maxMarks === numberQuery || Math.round(percentage) === Math.round(numberQuery)
    )

    // Match date string (partial or full)
    const dateMatch = formattedDate.includes(query)

    return textMatch || numericMatch || percentageMatch || dateMatch
  })
}



  }
}

// Input	Matches for date 
// Apr	Matches all scores attempted in April
// 2025	Matches all scores from the year 2025
// Apr 7	Matches April 7 specifically
// Apr 7, 2025	Matches that exact date (if formatted like this)
// 4/7/2025 4 is month and 7 is date