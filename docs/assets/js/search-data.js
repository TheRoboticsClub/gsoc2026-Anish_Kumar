// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/gsoc2026-Anish_Kumar/";
    },
  },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/gsoc2026-Anish_Kumar/blog/";
          },
        },{id: "post-from-ground-truth-to-the-camera",
        
          title: "From Ground Truth to the Camera",
        
        description: "Camera-based chase, two merges, paintable drones, three worlds, and RAM getting smaller.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/gsoc2026-Anish_Kumar/blog/2026/from-ground-truth-to-the-camera/";
          
        },
      },{id: "post-two-drones-one-manager-and-a-lot-of-things-that-were-only-pretending-to-work",
        
          title: "Two Drones, One Manager, and a Lot of Things That Were Only Pretending...",
        
        description: "Week 12 — finding the parts of the pipeline quietly held together by assumptions, and fixing them one by one.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/gsoc2026-Anish_Kumar/blog/2026/two-drones-one-manager/";
          
        },
      },{id: "post-polishing-prs-and-a-lot-of-code-review",
        
          title: "Polishing, PRs, and a Lot of Code Review",
        
        description: "Less building, more sharpening — tuning the chase, reworking cameras, and working through a detailed review cycle across four repos.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/gsoc2026-Anish_Kumar/blog/2026/polishing-prs-and-code-review/";
          
        },
      },{id: "post-a-bit-of-a-mixed-bag-but-a-good-one",
        
          title: "A Bit of a Mixed Bag (But a Good One)",
        
        description: "Chase algorithms, difficulty levels, a deep dive into video production, and finally cracking the N-robot parallel spawn.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/gsoc2026-Anish_Kumar/blog/2026/algorithms-video-and-n-robots/";
          
        },
      },{id: "post-n-robots-in-ram-testing-it-end-to-end",
        
          title: "N Robots in RAM — Testing It End to End",
        
        description: "Last week I designed the N-robots list approach. This week I wired it through the full stack, tested it with two F1 cars, and fought through every bug along the way.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/gsoc2026-Anish_Kumar/blog/2026/n-robots-in-ram-testing-end-to-end/";
          
        },
      },{id: "post-moving-from-n-users-to-n-robots",
        
          title: "Moving from N Users to N Robots",
        
        description: "RAM now handles multiple user applications — this week the work shifted to making the robot side symmetric too.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/gsoc2026-Anish_Kumar/blog/2026/n-robots-support/";
          
        },
      },{id: "post-getting-the-drone-cat-and-mouse-exercise-into-robotics-academy",
        
          title: "Getting the Drone Cat-and-Mouse Exercise into Robotics Academy",
        
        description: "Full integration of a two-drone chase exercise into RAM — database wiring, multi-process launch, and seven bugs debugged in order.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/gsoc2026-Anish_Kumar/blog/2026/drone-cat-mouse-integration/";
          
        },
      },{id: "post-multi-process-code-execution-in-roboticsacademy",
        
          title: "Multi-Process Code Execution in RoboticsAcademy",
        
        description: "Making RAM manage two independent agent processes from a single exercise session — the foundation for Drone Cat-Mouse.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/gsoc2026-Anish_Kumar/blog/2026/multiprocess-code-execution/";
          
        },
      },{id: "post-gazebo-city-world-amp-aerostack2-setup",
        
          title: "Gazebo City World &amp; Aerostack2 Setup",
        
        description: "Built a custom city environment in Gazebo Harmonic, spawned drones, and set up Aerostack2 as the flight control framework for the Cat-Mouse exercise.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/gsoc2026-Anish_Kumar/blog/2026/gazebo-city-world-and-aerostack2-setup/";
          
        },
      },{id: "post-integrating-multi-process-support-into-ram",
        
          title: "Integrating Multi-Process Support into RAM",
        
        description: "How a small PoC called Anish Manager proved the concept, and how that concept got folded into the real RoboticsApplicationManager codebase.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/gsoc2026-Anish_Kumar/blog/2026/ram-multiprocess-integration/";
          
        },
      },{id: "post-community-bonding-platform-architecture-amp-multi-agent-proposal",
        
          title: "Community Bonding: Platform Architecture &amp; Multi-Agent Proposal",
        
        description: "Deep dive into JdeRobot&#39;s three-repo platform architecture and a concrete proposal for multi-agent support in RAM.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/gsoc2026-Anish_Kumar/blog/2026/community-bonding/";
          
        },
      },{id: "books-the-godfather",
          title: 'The Godfather',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/gsoc2026-Anish_Kumar/books/the_godfather/";
            },},{id: "news-selected-as-gsoc-2026-contributor-with-jderobot-working-on-drone-cat-mouse-chase-exercise-community-bonding-period-started",
          title: 'Selected as GSoC 2026 contributor with JdeRobot — working on Drone Cat-Mouse Chase...',
          description: "",
          section: "News",},{id: "projects-project-1",
          title: 'project 1',
          description: "with background image",
          section: "Projects",handler: () => {
              window.location.href = "/gsoc2026-Anish_Kumar/projects/1_project/";
            },},{id: "projects-project-2",
          title: 'project 2',
          description: "a project with a background image and giscus comments",
          section: "Projects",handler: () => {
              window.location.href = "/gsoc2026-Anish_Kumar/projects/2_project/";
            },},{id: "projects-project-3-with-very-long-name",
          title: 'project 3 with very long name',
          description: "a project that redirects to another website",
          section: "Projects",handler: () => {
              window.location.href = "/gsoc2026-Anish_Kumar/projects/3_project/";
            },},{id: "projects-project-4",
          title: 'project 4',
          description: "another without an image",
          section: "Projects",handler: () => {
              window.location.href = "/gsoc2026-Anish_Kumar/projects/4_project/";
            },},{id: "projects-project-5",
          title: 'project 5',
          description: "a project with a background image",
          section: "Projects",handler: () => {
              window.location.href = "/gsoc2026-Anish_Kumar/projects/5_project/";
            },},{id: "projects-project-6",
          title: 'project 6',
          description: "a project with no image",
          section: "Projects",handler: () => {
              window.location.href = "/gsoc2026-Anish_Kumar/projects/6_project/";
            },},{id: "projects-project-7",
          title: 'project 7',
          description: "with background image",
          section: "Projects",handler: () => {
              window.location.href = "/gsoc2026-Anish_Kumar/projects/7_project/";
            },},{id: "projects-project-8",
          title: 'project 8',
          description: "an other project with a background image and giscus comments",
          section: "Projects",handler: () => {
              window.location.href = "/gsoc2026-Anish_Kumar/projects/8_project/";
            },},{id: "projects-project-9",
          title: 'project 9',
          description: "another project with an image 🎉",
          section: "Projects",handler: () => {
              window.location.href = "/gsoc2026-Anish_Kumar/projects/9_project/";
            },},{id: "teachings-data-science-fundamentals",
          title: 'Data Science Fundamentals',
          description: "This course covers the foundational aspects of data science, including data collection, cleaning, analysis, and visualization. Students will learn practical skills for working with real-world datasets.",
          section: "Teachings",handler: () => {
              window.location.href = "/gsoc2026-Anish_Kumar/teachings/data-science-fundamentals/";
            },},{id: "teachings-introduction-to-machine-learning",
          title: 'Introduction to Machine Learning',
          description: "This course provides an introduction to machine learning concepts, algorithms, and applications. Students will learn about supervised and unsupervised learning, model evaluation, and practical implementations.",
          section: "Teachings",handler: () => {
              window.location.href = "/gsoc2026-Anish_Kumar/teachings/introduction-to-machine-learning/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%61%6E%69%73%68%6B%75%6D%61%72%35%39%30%38%35@%67%6D%61%69%6C.%63%6F%6D", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/anishk85", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/anish-kumar-851830317", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
