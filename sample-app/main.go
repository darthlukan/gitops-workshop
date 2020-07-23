package main

import (
	"fmt"
	"os"
	"time"
)

func main() {
	for {
		fmt.Printf("%v\n", os.Args[1])
		time.Sleep(3 * time.Second)
	}
}
