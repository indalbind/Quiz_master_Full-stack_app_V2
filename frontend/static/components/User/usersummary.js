export default {
  data() {
    return {
      subjectData: [],
      monthData: [],
    };
  },
  template: `
    <div class="p-4">

      <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold" style = "display:inline">User Summary Dashboard</h2>
            <button @click="downloadUserCSV"
                class="rounded btn btn-info" style="margin-left:464px">
              📜 Download My Quiz CSV 
            </button>
      </div>
      <hr>
      <br>

      <div v-if="subjectData.length && monthData.length" class="charts-container flex flex-wrap gap-6">
        <!-- Bar Chart -->
        <div class="chart-box w-full md:w-1/2">
          <h3 class="text-lg font-semibold mb-2 text-center">Subject-wise Attempts</h3>
          <div class="chart-wrapper">
            <canvas id="subjectChart" class="chart-canvas"></canvas>
          </div>
        </div>

        <!-- Pie Chart -->
        <div class="chart-box w-full md:w-1/2">
          <h3 class="text-lg font-semibold mb-2 text-center">Monthly Quiz Attempts</h3>
          <div class="chart-wrapper">
            <canvas id="monthChart" class="chart-canvas"></canvas>
          </div>
        </div>
      </div>

      <div v-else>
        <p>Loading summary data...</p>
      </div>
      <br>
       <!-- <div>
        <button class="rounded btn  btn-warning" @click = "monthly_report"  > 📝 get montly report </button>
      </div> -->
    </div>
  `,
  methods: {
    monthly_report() {
      fetch("/api/monthly_report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      })
        .then(res => res.json())
        .then(data => {
          alert(data.msg || "report send");
        })
        .catch(err => {
          console.error("report error:", err);
          alert("Failed to report.");
        });
    },
    downloadUserCSV() {
      const token = localStorage.getItem("token");
      const url = "/download/user-csv";

      fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to download your quiz CSV.");
          }

          const disposition = response.headers.get("Content-Disposition");
          let filename = "my_quiz_data.csv"; // default fallback

          if (disposition && disposition.includes("filename=")) {
            const match = disposition.match(/filename="?([^"]+)"?/);
            if (match.length > 1) {
              filename = match[1];
            }
          }

          return response.blob().then((blob) => ({ blob, filename }));
        })
        .then(({ blob, filename }) => {
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(downloadUrl);
        })
        .catch((error) => {
          console.error("Error downloading your CSV:", error);
        });
    },
    async fetchUserSummaryData() {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/user/summary", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        this.subjectData = res.data.subject_wise_report || [];
        this.monthData = res.data.month_wise_report || [];

        this.$nextTick(() => {
          this.renderCharts();
        });

      } catch (error) {
            if (error.response && error.response.status === 403) {
                this.$router.replace({ name: 'blocked' });
                return;
            }
            console.error("Error fetching user summary:", error);
        }
    },

    renderCharts() {
      const subjectLabels = this.subjectData.map(item => item.subject_name);
      const subjectAttempts = this.subjectData.map(item => item.quizzes_attempted);

      new Chart(document.getElementById("subjectChart"), {
        type: "bar",
        data: {
          labels: subjectLabels,
          datasets: [{
            label: "Quizzes Attempted",
            data: subjectAttempts,
            backgroundColor: "#42A5F5"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });

      const monthLabels = this.monthData.map(item => item.month_name);
      const monthAttempts = this.monthData.map(item => item.quizzes_attempted);

      new Chart(document.getElementById("monthChart"), {
        type: "pie",
        data: {
          labels: monthLabels,
          datasets: [{
            data: monthAttempts,
            backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#66BB6A"]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                boxWidth: 20,
                padding: 15
              }
            }
          }
        }
      });
    }
  },
  mounted() {
    this.fetchUserSummaryData();
  }
};
