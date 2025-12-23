import json
import sys
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError

# Setup paths relative to this script
# Equivalent to: join(__dirname, '..', 'public', '...')
BASE_DIR = Path(__file__).resolve().parent.parent / "public"
SRC_FILE = BASE_DIR / "players.json"
OUT_FILE = BASE_DIR / "players_pruned.json"

# Ensure directory exists
BASE_DIR.mkdir(parents=True, exist_ok=True)

# Fields to keep
KEEP = {
    "player_id",
    "first_name",
    "last_name",
    "full_name",
    "position",
    "team",
    "status",
    "bye_week",
    "fantasy_positions",
    "injury_status",
}


def prune_object(obj):
    """Creates a new dictionary containing only the allowed keys."""
    res = {k: v for k, v in obj.items() if k in KEEP}

    # Ensure player_id exists if original key is id-like
    if "player_id" not in res:
        if "id" in obj:
            res["player_id"] = obj["id"]
        elif "playerId" in obj:
            res["player_id"] = obj["playerId"]

    return res


def main():
    print("Downloading players data...")

    try:
        # Fetch data using standard library
        with urlopen(Request("https://api.sleeper.app/v1/players/nfl")) as response:
            data = json.loads(response.read().decode())

        # 1. Write Raw Data
        # sort_keys=True ensures consistent ordering for diffs
        with open(SRC_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, sort_keys=True)
        print(f"Raw players written to {SRC_FILE}")

        # 2. Prune Data
        pruned_data = None

        if isinstance(data, list):
            pruned_data = [prune_object(item) for item in data]

        elif isinstance(data, dict):
            # Handle map of id -> player (Sleeper API usually returns this)
            # Check if values are dicts to confirm it's a map
            if data and isinstance(next(iter(data.values())), dict):
                pruned_data = {}
                for k, v in data.items():
                    pruned_item = prune_object(v)
                    # Keep key as player_id if missing
                    if "player_id" not in pruned_item:
                        pruned_item["player_id"] = k
                    pruned_data[k] = pruned_item
            else:
                # Single object
                pruned_data = prune_object(data)
        else:
            raise ValueError("Unexpected players.json format")

        # 3. Write Pruned Data
        with open(OUT_FILE, "w", encoding="utf-8") as f:
            json.dump(pruned_data, f, indent=2, sort_keys=True)
        print(f"Pruned players written to {OUT_FILE}")

    except (URLError, ValueError, OSError) as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
