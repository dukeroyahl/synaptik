export class TagUtils {
  /**
   * Format tags consistently (capitalize first letter, trim, remove empty)
   */
  static formatTags(tags: string[] | string): string[] {
    const tagArray = Array.isArray(tags) ? tags : [tags]
    
    return tagArray
      .map(tag => {
        const trimmed = tag.trim()
        if (!trimmed) return ''
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
      })
      .filter(tag => tag !== '')
  }

  /**
   * Parse tag string input (handles comma-separated values)
   */
  static parseTagInput(input: string): string[] {
    if (!input.trim()) return []
    
    return input
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '')
      .map(tag => this.formatTag(tag))
  }

  /**
   * Format a single tag
   */
  static formatTag(tag: string): string {
    const trimmed = tag.trim()
    if (!trimmed) return ''
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
  }

  /**
   * Validate a tag name
   */
  static isValidTag(tag: string): boolean {
    const trimmed = tag.trim()
    return trimmed.length > 0 && 
           trimmed.length <= 50 && 
           /^[a-zA-Z0-9_-]+$/.test(trimmed)
  }

  /**
   * Filter tags to only include valid ones
   */
  static filterValidTags(tags: string[]): string[] {
    return tags.filter(tag => this.isValidTag(tag))
  }

  /**
   * Get unique tags from an array
   */
  static getUniqueTags(tags: string[]): string[] {
    return [...new Set(this.formatTags(tags))]
  }

  /**
   * Get tag color for display (based on tag name hash)
   */
  static getTagColor(tag: string): string {
    const colors = [
      '#e3f2fd', '#f3e5f5', '#e8f5e8', '#fff3e0',
      '#fce4ec', '#e0f2f1', '#f1f8e9', '#fff8e1'
    ]
    
    const hash = tag.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    
    return colors[Math.abs(hash) % colors.length]
  }

  /**
   * Search tags by query string
   */
  static searchTags(tags: string[], query: string): string[] {
    if (!query.trim()) return tags
    
    const lowercaseQuery = query.toLowerCase()
    return tags.filter(tag => 
      tag.toLowerCase().includes(lowercaseQuery)
    )
  }

  /**
   * Get common tags from multiple tasks
   */
  static getCommonTags(taskTags: string[][]): string[] {
    if (taskTags.length === 0) return []
    
    const tagCounts = new Map<string, number>()
    
    taskTags.forEach(tags => {
      const uniqueTags = this.getUniqueTags(tags)
      uniqueTags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })
    
    // Return tags that appear in all task collections
    return Array.from(tagCounts.entries())
      .filter(([_, count]) => count === taskTags.length)
      .map(([tag]) => tag)
  }

  /**
   * Generate tag suggestions based on existing tags
   */
  static generateTagSuggestions(existingTags: string[], inputValue: string): string[] {
    if (!inputValue.trim()) return existingTags.slice(0, 10)
    
    const searchResults = this.searchTags(existingTags, inputValue)
    return searchResults.slice(0, 5)
  }

  /**
   * Convert tags to display format for UI
   */
  static tagsToDisplayString(tags: string[]): string {
    return this.formatTags(tags).join(', ')
  }

  /**
   * Create tag filter for API queries
   */
  static createTagFilter(tags: string[]): { tags?: string[] } {
    const formattedTags = this.formatTags(tags)
    return formattedTags.length > 0 ? { tags: formattedTags } : {}
  }
}