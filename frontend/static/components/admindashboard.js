export default {
  template: `
    <div class="content-wrapper">
      <h2 class="text-2xl font-bold mb-4">Welcome, Admin</h2>
            <!-- 🔍 Search Bar    -->
      <div class="d-flex align-items-center border rounded px-2 mb-4" style="background-color: white; width: 300px;">
        <span class="me-2 text-muted">🔍</span>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search chapter..."
          class="form-control border-0 shadow-none"
        />
      </div>

      <!-- Subject Grid -->
      <div class="d-flex flex-wrap gap-3">
        <div v-for="subject in filteredSubjects" :key="subject.id" class="card p-3" style="width: 600px; background-color:rgb(232, 248, 243); border-radius: 0.8rem;">
          <h5 class="fw-bold">{{ subject.name }}</h5>
          <p>{{ subject.description }}</p>

          <!-- Chapter List with Headers -->
          <div class="mb-2">
            <div class="list-group-item d-flex fw-bold justify-content-between" style="background-color:rgb(232, 248, 243); border-radius: 0.4rem;">
              <span style="width: 40%;">Chapter Name</span>
              <span style="width: 30%;">Total question</span>
              <span style="width: 30%;text-align:center;">Actions</span>
            </div>

            <!-- Chapter Rows -->
            <div v-for="chapter in subject.chapters" :key="chapter.id" class="list-group-item d-flex justify-content-between align-items-center" style="background-color:rgb(232, 248, 243); border-radius: 0.2rem;">
              <span style="width: 40%; cursor: pointer; color:rgb(58, 84, 126);" @click="quiz(chapter.id)">
                {{ chapter.name }}
              </span>
              <span style="width: 30%; text-align:center;">{{ chapter.total_questions || 0 }}</span>
              <span style="width: 30%; text-align:center;">
                <button class="btn btn-sm btn-outline-primary" @click="editChapter(chapter.id)">Edit</button>
                <button class="btn btn-sm btn-outline-danger" @click="deleteChapter(chapter.id)">Delete</button>
              </span>
            </div>
          </div>

          <!-- Chapter + Subject Buttons -->
          <button class="btn btn-success btn-sm mb-2" @click="addChapter(subject.id)"> + Chapter </button>
          <hr/>
          <div class="d-flex gap-2">
            <button class="btn btn-warning btn-sm" @click="editSubject(subject.id)">Edit Subject</button>
            <button class="btn btn-danger btn-sm" @click="deleteSubject(subject.id)">Delete Subject</button>
          </div>
        </div>
      </div>

      <!-- Add Subject Button -->
      <button class="btn btn-primary mt-4" style="margin-bottom:10px" @click="addSubject"> + Add Subject </button>
      <div class = "dashboard"> </div>
    </div>
  `,
  data() {
    return {
      subjects: [],
      quizzes: [],
      searchQuery: '',
      jwtToken: localStorage.getItem("token")
    };
  },
  created() {
    this.fetchSubjectDetails();
  },
  computed: {
    filteredSubjects() {
      if (!this.searchQuery.trim()) return this.subjects;

      const q = this.searchQuery.toLowerCase();

      return this.subjects
        .map(subject => {
          const matchedChapters = subject.chapters.filter(chapter =>
            chapter.name.toLowerCase().includes(q)
          );

          return {
            ...subject,
            chapters: matchedChapters
          };
        })
        .filter(subject => subject.chapters.length > 0);
    }
  },
  methods: {
    fetchSubjectDetails() {
      axios.get("/api/subject", {
        headers: { Authorization: `Bearer ${this.jwtToken}` },
      }).then(async (res) => {
        const subjects = res.data.subjects;
        const detailedSubjects = [];

        for (const subject of subjects) {
          const detailRes = await axios.get(`/api/subject/${subject.id}/detail`, {
            headers: { Authorization: `Bearer ${this.jwtToken}` },
          });
          const subjectDetail = detailRes.data.subject;
          detailedSubjects.push({
            ...subject,
            chapters: subjectDetail.chapters || [],
          });
        }

        this.subjects = detailedSubjects;
      });
    },

    addSubject() {
      this.$router.push({name:'addsubject'})
    },
    editSubject(subjectId) {
      this.$router.push({name:'editsubject',params:{subjectId}})
    },
    deleteSubject(id) {
      if (confirm("Delete this subject?")) {
        axios.delete(`/api/subject/${id}`, {
          headers: { Authorization: `Bearer ${this.jwtToken}` },
        }).then(() => this.fetchSubjectDetails());
      }
    },
    
    addChapter(subjectId) {
      this.$router.push({name:'addchapter',params:{subjectId}})
    },
    editChapter(chapterId) {
      this.$router.push({name:'editchapter', params:{chapterId}})
    },
    deleteChapter(id) {
      if (confirm("Delete this chapter?")) {
        axios.delete(`/api/chapter/${id}`, {
          headers: { Authorization: `Bearer ${this.jwtToken}` },
        }).then(() => this.fetchSubjectDetails());
      }
    },
    quiz(chapterId) {
      this.$router.push({ name: 'Quizinfo', params: { chapterId } }); // so we got the the quizinfo in router.js 
    }
  }
};

// nead to change this 