export default {
  data() {
    return {
      summaryData: null,
    };
  },
  template: `
    <div class="p-4">

    <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold mb-6" style="display:inline">Admin Summary Dashboard </h2>
          <button @click="downloadAdminCSV" class="rounded btn btn-info"style="margin-left:464px">
             📜 Download Summary CSV 
          </button>
      </div>
      <hr>
      <br>

      <div v-if="summaryData" class="charts-container flex flex-wrap gap-6">
        <!-- Bar Chart -->
        <div class="chart-box w-full md:w-1/2">
          <h3 class="text-lg font-semibold mb-2 text-center">Subject-wise Top Scores</h3>
          <div class="chart-wrapper">
            <canvas id="topScoreBarChart" class="chart-canvas"></canvas>
          </div>
        </div>

        <!-- Pie Chart -->
        <div class="chart-box w-full md:w-1/2">
          <h3 class="text-lg font-semibold mb-2 text-center">Subject-wise User Attempts</h3>
          <div class="chart-wrapper">
            <canvas id="attemptPieChart" class="chart-canvas"></canvas>
          </div>
        </div>
      </div>

      <div v-else>
        <p>Loading summary data...</p>
      </div>

      <br>
      <div>
          <button class="rounded btn  btn-warning" @click = "sendemail"> 📮 send the mail for latest quiz added  
          </button>
          <button class="rounded btn  btn-warning" @click = "monthly_report" style="display: inline;margin-left:600px" >  send the monthly reports mail
          </button>
      </div>
      
      
    </div>
  `,
  methods: {
    downloadAdminCSV() {
      const token = localStorage.getItem("token");
      const url = "/download/admin-csv";

      // Create an invisible <a> element and trigger the download
      fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to download CSV.");
          }
          return response.blob();
        })
        .then((blob) => {
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = "admin_user_quiz_data.csv";
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(downloadUrl);
        })
        .catch((error) => {
          console.error("Error downloading CSV:", error);
        });
    },
    sendemail() {
      fetch("/api/send-daily-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      })
        .then(res => res.json())
        .then(data => {
          alert(data.msg || "Reminders sent");
        })
        .catch(err => {
          console.error("Reminder error:", err);
          alert("Failed to send reminders.");
        });
    },
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
    async fetchSummaryData() {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/admin/summary", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        this.summaryData = res.data;
        this.$nextTick(() => {
          this.renderCharts();
        });
      } catch (error) {
        console.error("Error fetching summary data:", error);
      }
    },
    renderCharts() {
      const attempts = this.summaryData.subject_user_attempts;
      const topScores = this.summaryData.subject_top_scores;

      // Pie Chart
      const pieLabels = attempts.map(item => item.subject_name);
      const pieData = attempts.map(item =>
        item.user_attempts.reduce((sum, u) => sum + u.attempts, 0)
      );

      new Chart(document.getElementById("attemptPieChart"), {
        type: "pie",
        data: {
          labels: pieLabels,
          datasets: [{
            data: pieData,
            backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56", "#4BC0C0", "#9966FF"]
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

      // Bar Chart
      const barLabels = topScores.map(item => item.subject_name);
      const barData = topScores.map(item =>
        item.top_scores.reduce((max, s) => Math.max(max, s.top_score), 0)
      );

      new Chart(document.getElementById("topScoreBarChart"), {
        type: "bar",
        data: {
          labels: barLabels,
          datasets: [{
            label: "Top Score",
            data: barData,
            backgroundColor: "#42A5F5"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }
  },
  mounted() {
    this.fetchSummaryData();
  }
};