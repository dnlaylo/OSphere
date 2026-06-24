const searchData = [
  // MODULE 1
  {
    title: "Operating System Introduction",
    module: "Module 1",
    url: "../Module%201/index.html",
    content: "Introduction to operating systems and their goals."
  },
  {
    title: "Multiprocessor Systems",
    module: "Module 1",
    url: "../Module%201/index.html",
    content: "Systems with more than one CPU in close communication."
  },
  {
    title: "Distributed Systems",
    module: "Module 1",
    url: "../Module%201/index.html",
    content: "Loosely coupled systems that distribute computation among processors."
  },
  {
    title: "Real-Time Systems",
    module: "Module 1",
    url: "../Module%201/index.html",
    content: "Systems with fixed time constraints and deterministic behavior."
  },
  {
    title: "Handheld Systems",
    module: "Module 1",
    url: "../Module%201/index.html",
    content: "Operating systems for mobile and embedded devices."
  },
  {
    title: "Computing Environments",
    module: "Module 1",
    url: "../Module%201/index.html",
    content: "Traditional computing, web-based computing, and embedded computing."
  },
  {
    title: "Traditional Computing",
    module: "Module 1",
    url: "../Module%201/index.html",
    content: "Programs installed and run locally on a computer."
  },
  {
    title: "Web-Based Computing",
    module: "Module 1",
    url: "../Module%201/index.html",
    content: "Applications running through the internet and browsers."
  },
  {
    title: "Embedded Computing",
    module: "Module 1",
    url: "../Module%201/index.html",
    content: "Computers built into machines and appliances."
  },

  // MODULE 2
  {
    title: "Operating System Structures",
    module: "Module 2",
    url: "../Module%202/index.html",
    content: "Internal structure and organization of operating systems."
  },
  {
    title: "Interrupts",
    module: "Module 2",
    url: "../Module%202/index.html",
    content: "Signals that transfer control to interrupt service routines."
  },
  {
    title: "Interrupt Handling",
    module: "Module 2",
    url: "../Module%202/index.html",
    content: "Polling and vectored interrupt systems."
  },
  {
    title: "I/O Structure",
    module: "Module 2",
    url: "../Module%202/index.html",
    content: "Synchronous and asynchronous I/O operations."
  },
  {
    title: "DMA",
    module: "Module 2",
    url: "../Module%202/index.html",
    content: "Direct Memory Access for high-speed devices."
  },
  {
    title: "Storage Hierarchy",
    module: "Module 2",
    url: "../Module%202/index.html",
    content: "Registers, cache, RAM, SSD, HDD, optical disks, and tape."
  },
  {
    title: "Dual-Mode Operation",
    module: "Module 2",
    url: "../Module%202/index.html",
    content: "User mode and kernel mode execution."
  },
  {
    title: "Protection Mechanisms",
    module: "Module 2",
    url: "../Module%202/index.html",
    content: "Memory, I/O, and CPU protection."
  },
  {
    title: "System Calls",
    module: "Module 2",
    url: "../Module%202/index.html",
    content: "Interface between user programs and the operating system."
  },
  {
    title: "OS Structure",
    module: "Module 2",
    url: "../Module%202/index.html",
    content: "Simple, layered, microkernel, and modular operating systems."
  },

  // MODULE 3
  {
    title: "Processes",
    module: "Module 3",
    url: "../Module%203/index.html",
    content: "Programs in execution managed by the operating system."
  },
  {
    title: "Process States",
    module: "Module 3",
    url: "../Module%203/index.html",
    content: "New, Ready, Running, Waiting, and Terminated states."
  },
  {
    title: "PCB",
    module: "Module 3",
    url: "../Module%203/index.html",
    content: "Process Control Block containing process information."
  },
  {
    title: "Process Scheduling",
    module: "Module 3",
    url: "../Module%203/index.html",
    content: "Job queue, ready queue, and device queues."
  },
  {
    title: "Context Switching",
    module: "Module 3",
    url: "../Module%203/index.html",
    content: "Saving and restoring process states."
  },
  {
    title: "Operations on Processes",
    module: "Module 3",
    url: "../Module%203/index.html",
    content: "Process creation, execution, and termination."
  },
  {
    title: "Fork",
    module: "Module 3",
    url: "../Module%203/index.html",
    content: "UNIX system call that creates a child process."
  },
  {
    title: "Exec",
    module: "Module 3",
    url: "../Module%203/index.html",
    content: "System call that replaces a process image."
  },

  // MODULE 4
  {
    title: "CPU Scheduling",
    module: "Module 4",
    url: "../Module%204/index.html",
    content: "Allocation of CPU time among processes."
  },
  {
    title: "CPU-I/O Burst Cycle",
    module: "Module 4",
    url: "../Module%204/index.html",
    content: "Alternation between CPU execution and I/O waiting."
  },
  {
    title: "Dispatcher",
    module: "Module 4",
    url: "../Module%204/index.html",
    content: "Module that gives CPU control to a selected process."
  },
  {
    title: "FCFS",
    module: "Module 4",
    url: "../Module%204/index.html",
    content: "First Come First Serve scheduling algorithm."
  },
  {
    title: "SJF",
    module: "Module 4",
    url: "../Module%204/index.html",
    content: "Shortest Job First scheduling algorithm."
  },
  {
    title: "SRTF",
    module: "Module 4",
    url: "../Module%204/index.html",
    content: "Shortest Remaining Time First algorithm."
  },
  {
    title: "Round Robin",
    module: "Module 4",
    url: "../Module%204/index.html",
    content: "Time-sharing scheduling algorithm using a quantum."
  },
  {
    title: "Priority Scheduling",
    module: "Module 4",
    url: "../Module%204/index.html",
    content: "Scheduling based on process priority."
  },
  {
    title: "HRRN",
    module: "Module 4",
    url: "../Module%204/index.html",
    content: "Highest Response Ratio Next scheduling algorithm."
  },
  {
    title: "Multilevel Queue",
    module: "Module 4",
    url: "../Module%204/index.html",
    content: "Processes divided into separate queues."
  },
  {
    title: "Multilevel Feedback Queue",
    module: "Module 4",
    url: "../Module%204/index.html",
    content: "Processes move between queues based on behavior."
  },

  // MODULE 5
  {
    title: "Memory Management",
    module: "Module 5",
    url: "../Module%205/index.html",
    content: "Allocation and protection of main memory."
  },
  {
    title: "Memory Allocation",
    module: "Module 5",
    url: "../Module%205/index.html",
    content: "Techniques for allocating memory to processes."
  },
  {
    title: "Fragmentation",
    module: "Module 5",
    url: "../Module%205/index.html",
    content: "Internal and external fragmentation."
  },
  {
    title: "Paging",
    module: "Module 5",
    url: "../Module%205/index.html",
    content: "Memory management using pages and frames."
  },
  {
    title: "Swapping",
    module: "Module 5",
    url: "../Module%205/index.html",
    content: "Moving processes between memory and disk."
  },
  {
    title: "MMU",
    module: "Module 5",
    url: "../Module%205/index.html",
    content: "Memory Management Unit for address translation."
  },
  {
    title: "MFT",
    module: "Module 5",
    url: "../Module%205/index.html",
    content: "Multiprogramming with Fixed Tasks."
  },
  {
    title: "MVT",
    module: "Module 5",
    url: "../Module%205/index.html",
    content: "Multiprogramming with Variable Tasks."
  },

  // MODULE 6
  {
    title: "Virtual Memory",
    module: "Module 6",
    url: "../Module%206/index.html",
    content: "Execution of programs larger than physical memory."
  },
  {
    title: "Demand Paging",
    module: "Module 6",
    url: "../Module%206/index.html",
    content: "Pages are loaded only when needed."
  },
  {
    title: "Page Replacement",
    module: "Module 6",
    url: "../Module%206/index.html",
    content: "Replacing pages when frames are full."
  },
  {
    title: "FIFO",
    module: "Module 6",
    url: "../Module%206/index.html",
    content: "First In First Out page replacement algorithm."
  },
  {
    title: "LRU",
    module: "Module 6",
    url: "../Module%206/index.html",
    content: "Least Recently Used page replacement algorithm."
  },
  {
    title: "LFU",
    module: "Module 6",
    url: "../Module%206/index.html",
    content: "Least Frequently Used page replacement algorithm."
  },
  {
    title: "Optimal Page Replacement",
    module: "Module 6",
    url: "../Module%206/index.html",
    content: "Replaces the page that will not be used for the longest time."
  },

  // MODULE 7
  {
    title: "Mass Storage Management",
    module: "Module 7",
    url: "../Module%207/index.html",
    content: "Disk management and scheduling."
  },
  {
    title: "Disk Structure",
    module: "Module 7",
    url: "../Module%207/index.html",
    content: "Tracks, sectors, cylinders, and platters."
  },
  {
    title: "Disk Scheduling",
    module: "Module 7",
    url: "../Module%207/index.html",
    content: "Algorithms for servicing disk requests."
  },
  {
    title: "SSTF",
    module: "Module 7",
    url: "../Module%207/index.html",
    content: "Shortest Seek Time First."
  },
  {
    title: "SCAN",
    module: "Module 7",
    url: "../Module%207/index.html",
    content: "Elevator disk scheduling algorithm."
  },
  {
    title: "C-SCAN",
    module: "Module 7",
    url: "../Module%207/index.html",
    content: "Circular SCAN algorithm."
  },
  {
    title: "LOOK",
    module: "Module 7",
    url: "../Module%207/index.html",
    content: "SCAN variant that reverses at the last request."
  },
  {
    title: "C-LOOK",
    module: "Module 7",
    url: "../Module%207/index.html",
    content: "Circular LOOK algorithm."
  },

  // MODULE 8
  {
    title: "Deadlock",
    module: "Module 8",
    url: "../Module%208/index.html",
    content: "Processes permanently blocked waiting for resources."
  },
  {
    title: "Deadlock Detection",
    module: "Module 8",
    url: "../Module%208/index.html",
    content: "Methods for detecting deadlocks."
  },
  {
    title: "Deadlock Prevention",
    module: "Module 8",
    url: "../Module%208/index.html",
    content: "Strategies to prevent deadlocks."
  },
  {
    title: "Deadlock Avoidance",
    module: "Module 8",
    url: "../Module%208/index.html",
    content: "Keeping the system in a safe state."
  },
  {
    title: "Banker's Algorithm",
    module: "Module 8",
    url: "../Module%208/index.html",
    content: "Deadlock avoidance algorithm using resource allocation."
  }
];