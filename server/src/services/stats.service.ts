import type {
  DashboardStats,
  StatsRepository,
} from "../repositories/stats.repository";

export class StatsService {
  constructor(private readonly repo: StatsRepository) {}

  dashboard(): DashboardStats {
    return this.repo.dashboard();
  }
}
