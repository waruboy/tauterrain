package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	hub := newHub()
	go hub.run()

	// Build client: cd hello-world && npm run build
	staticDir := http.Dir("../hello-world/dist")
	fileServer := http.FileServer(staticDir)

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", hub.handleWS)
	mux.Handle("/", fileServer)

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	// Start server in background
	go func() {
		log.Printf("server listening on :%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	// Wait for shutdown signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("shutdown error: %v", err)
	}
	log.Println("stopped")
}

