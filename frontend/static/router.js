import home from "./components/home.js"; // importing the home component 
import login from "./components/login.js";
import register from "./components/register.js";
import admindashboard from "./components/admindashboard.js";
import addsubject from "./components/addsubject.js"
import addchapter from "./components/addchapter.js";
import editsubject from "./components/editsubject.js";
import addquestion from "./components/addquestion.js";
import addquiz from "./components/addquiz.js";
import alluser from "./components/alluser.js";
import chapterquiz from "./components/chapterquiz.js";
import editchapter from "./components/editchapter.js";
import editquestion from "./components/editquestion.js";
import adminsummary from "./components/adminsummary.js";
import userdashboard from "./components/User/userdashboard.js";
import viewquiz from "./components/User/viewquiz.js"; // when user click on view quiz then it run
import startquiz from "./components/User/startquiz.js";
import blockeduser from "./components/User/blockeduser.js";
import score from "./components/User/score.js";
import usersummary from "./components/User/usersummary.js";
import quizlocked from "./components/User/quizlocked.js";
import editquiz from "./components/editquiz.js";

const routes=[
    {path:'/', component : home},
    {path:'/login', component:login},
    {path:'/signup',component:register},
    {path:'/admin/home',component : admindashboard,name:'admindashboard'},
    {path:'addsubject',component:addsubject,name:'addsubject'},
    {path:'/addchapter/:subjectId', component:addchapter,  name:'addchapter'},
    {path:'editsubject/:subjectId',component:editsubject,name:'editsubject'},
    {path:'/addqueston/:quizId',component:addquestion,name:'AddQuestion'},
    {path:'/addquiz/:chapterId',component:addquiz,name:'AddQuiz'},
    {path:'/admin/user',component:alluser},
    {path:'/quizinfo/:chapterId',component:chapterquiz,name:'Quizinfo'},
    {path:'/editchapter/:chapterId', component:editchapter,name:'editchapter'},
    {path: '/question/edit/:id',name: 'EditQuestion',component: editquestion,props: true},
    {path:'/admin/summary',component:adminsummary},
    { path: '/user/home', component: userdashboard,name:'userhome'},
    {path:'/viewquiz/:quizId', component:viewquiz, name:'viewquiz'},
    {path:'/startquiz/:quizId',component:startquiz , name :'startquiz'},
    {path: '/blocked',name: 'blocked',component : blockeduser},
    {path:'/user/score',component:score},
    {path:'/user/summary',component:usersummary},
    {path:'/quiz_locked',component:quizlocked,name:'QuizLocked'},
    {path: '/edit-quiz/:id/:chapterId?',component: editquiz, name: 'Update_quiz',}






]



// Create router
const router = new VueRouter({
    routes,
    mode: 'hash'  // Important: use hash mode to avoid server-side 404 errors
  });
  
  // Navigation guard
  router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
  
    // Check if user is logged in
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.is_admin ? 'admin' : 'user';
  
        // If logged in and trying to go to /login → redirect to dashboard
        if (to.path === '/login') {
          return next(role === 'admin' ? '/admin/home' : '/user/home');
        }
  
        // If user is trying to go to root, also redirect to dashboard
        if (to.path === '/') {
          return next(role === 'admin' ? '/admin/home' : '/user/home');
        }
  
        next(); // Proceed to requested page
      } catch (e) {
        console.error('Invalid token');
        localStorage.removeItem('token');
        next('/login');
      }
    } else {
      // If not logged in and trying to access protected pages
      if (to.path.startsWith('/admin') || to.path.startsWith('/user')) {
        return next('/login');
      }
  
      next(); // Continue for public routes
    }
  });
  
export default router;